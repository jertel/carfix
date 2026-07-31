import { calculateFordChecksum } from '../obd/checksum';

/**
 * Formats OBD payload bytes into standard 12-hex-digit (6 byte) Ford As-Built line format (e.g. "283C 1194 0258").
 * Uses the line index from the target address to select the 5-byte payload chunk (bytes 1-5 for line 1, bytes 6-10 for line 2, etc.).
 */
export function formatAsBuiltLineHex(address: string, payloadBytes: number[]): string {
  if (!payloadBytes || payloadBytes.length === 0) {
    return 'NO DATA';
  }

  // Extract line index from address (e.g. "726-02-02" -> line 2)
  const parts = address ? address.split('-') : [];
  const lineStr = parts.length === 3 ? parts[2] : (parts.length === 2 ? parts[1] : '1');
  const lineNum = parseInt(lineStr, 10);
  const validLineNum = (!isNaN(lineNum) && lineNum > 0) ? lineNum : 1;

  // Each line has up to 5 data bytes (0-indexed start = (lineNum - 1) * 5)
  const startIndex = (validLineNum - 1) * 5;
  if (payloadBytes.length <= startIndex) {
    return 'NO DATA';
  }

  const dataBytes = payloadBytes.slice(startIndex, startIndex + 5);

  const dataHex = dataBytes.map(b => b.toString(16).padStart(2, '0').toUpperCase()).join('');

  const checksumHex = calculateFordChecksum(address, dataHex);

  const fullHex = dataHex + checksumHex;
  return fullHex.match(/.{1,4}/g)?.join(' ') || fullHex;
}

/**
 * Parses raw OBD-II / UDS / ISO-TP response string, stripping CAN headers (e.g. 7E8, 706),
 * ISO-TP PCI bytes (single frame 0x0N, first frame 0x10 xx, consecutive frame 0x2x),
 * line index prefixes (e.g. 0:), and OBD positive service response headers (0x41, 0x49, 0x62).
 */
export function parseObdPayloadBytes(raw: string, expectedCommand?: string): number[] {
  if (!raw) return [];
  if (/NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(raw)) return [];

  const lines = raw.replace(/\r/g, '\n').split('\n');
  const allPayloadHexTokens: string[] = [];

  for (let line of lines) {
    line = line.trim();
    if (!line || line === '>') continue;
    if (line.endsWith('>')) {
      line = line.substring(0, line.length - 1).trim();
    }
    // Remove line index prefix like "0: ", "1: "
    line = line.replace(/^[0-9A-Fa-f]:\s*/, '');

    const tokens = line.split(/\s+/).filter(t => t.length > 0);
    if (tokens.length === 0) continue;

    let idx = 0;
    // Check if first token is a 3-hex-char (11-bit) or 8-hex-char (29-bit) CAN ID
    if (/^[0-9A-Fa-f]{3}$/.test(tokens[idx]) || /^[0-9A-Fa-f]{8}$/.test(tokens[idx])) {
      idx++;
    }

    if (idx >= tokens.length) continue;

    // Check for ISO-TP PCI (Protocol Control Information) byte
    const pci = tokens[idx];
    if (/^0[1-9A-Fa-f]$/i.test(pci)) {
      // Single frame: length is in lower nibble
      idx++;
    } else if (/^1[0-9A-Fa-f]$/i.test(pci)) {
      // First frame: skip PCI and 1-byte length
      idx += 2;
    } else if (/^2[0-9A-Fa-f]$/i.test(pci)) {
      // Consecutive frame: skip sequence counter PCI
      idx++;
    } else if (/^3[0-9A-Fa-f]$/i.test(pci)) {
      // Flow control frame
      idx += 3;
    }

    while (idx < tokens.length) {
      const token = tokens[idx];
      if (/^[0-9A-Fa-f]{2}$/.test(token)) {
        allPayloadHexTokens.push(token.toUpperCase());
      }
      idx++;
    }
  }

  // Convert hex tokens to byte numbers
  let bytes = allPayloadHexTokens.map(t => parseInt(t, 16));
  if (bytes.length === 0) {
    // Fallback parsing if tokens were not space separated
    const clean = raw.replace(/[^0-9A-Fa-f]/g, '');
    for (let i = 0; i < clean.length - 1; i += 2) {
      bytes.push(parseInt(clean.substring(i, i + 2), 16));
    }
  }

  // Strip OBD/UDS Positive Response Header
  // Mode 01 positive response is 0x41 PID
  // Mode 09 positive response is 0x49 PID
  // Mode 22 positive response is 0x62 DID_HI DID_LO
  if (bytes.length >= 2 && bytes[0] === 0x41) {
    bytes = bytes.slice(2);
  } else if (bytes.length >= 2 && bytes[0] === 0x49) {
    if (bytes.length >= 3 && (bytes[2] === 0x01 || bytes[2] === 0x00)) {
      bytes = bytes.slice(3);
    } else {
      bytes = bytes.slice(2);
    }
  } else if (bytes.length >= 3 && bytes[0] === 0x62) {
    bytes = bytes.slice(3);
  }

  return bytes;
}

/**
  Decodes raw hex byte string (e.g. "4D4C33542D3134473634372D4142") into human-readable ASCII string (e.g. "ML3T-14G647-AB")
 */
export function hexToAscii(hex: string): string {
  if (!hex) return '';
  const bytes = parseObdPayloadBytes(hex);
  let result = '';
  for (const code of bytes) {
    if (code >= 32 && code <= 126) {
      result += String.fromCharCode(code);
    }
  }
  return result.trim();
}

/**
 * Maps module acronyms (e.g. "APIM", "BCM") to 3-character hex CAN module IDs (e.g. "7D0", "726").
 */
export function normalizeModuleId(moduleId: string): string {
  if (!moduleId) return '726';
  const clean = moduleId.trim().toUpperCase();
  const aliasMap: Record<string, string> = {
    'APIM': '7D0',
    'BCM': '726',
    'BDYCM': '726',
    'IPMA': '706',
    'IPMB': '7B1',
    'PCM': '7E0',
    'ECM': '7E0',
    'TCM': '7E1',
    'BECM': '7E7',
    'SOBDM': '7E2',
    'TMC': '7E4',
    'GSM': '732',
    'GWM': '716',
    'HVAC': '733',
    'DDM': '740',
    'PDM': '741',
    'DSM': '744',
    'PSCM': '730',
    'ABS': '760',
    'SCCM': '724',
    'RCM': '737',
    'SODL': '7C4',
    'SODR': '7C5',
    'CCM': '764',
    'IPC': '720',
    'ACM': '727',
    'DSP': '783',
    'TCU': '754'
  };
  return aliasMap[clean] || clean;
}

/**
 * Maps CAN module hex IDs (e.g. "726", "7D0", "706") to standard OEM abbreviations (e.g. "BCM", "APIM", "IPMA").
 */
export function getModuleAbbreviation(moduleId: string): string {
  if (!moduleId) return '';
  const clean = moduleId.trim().toUpperCase();
  const hexToAbbrevMap: Record<string, string> = {
    '7D0': 'APIM',
    '726': 'BCM',
    '706': 'IPMA',
    '7B1': 'IPMB',
    '7E0': 'PCM',
    '7E1': 'TCM',
    '7E7': 'BECM',
    '7E2': 'SOBDM',
    '7E4': 'TMC',
    '732': 'GSM',
    '716': 'GWM',
    '733': 'HVAC',
    '740': 'DDM',
    '741': 'PDM',
    '744': 'DSM',
    '730': 'PSCM',
    '760': 'ABS',
    '724': 'SCCM',
    '737': 'RCM',
    '7C4': 'SODL',
    '7C5': 'SODR',
    '764': 'CCM',
    '720': 'IPC',
    '727': 'ACM',
    '783': 'DSP',
    '754': 'TCU'
  };
  return hexToAbbrevMap[clean] || clean;
}

/**
 * Resolves standard OEM abbreviation for a module given its ID and name.
 * Uses getModuleAbbreviation(id) first, falling back to name acronym extraction or raw ID.
 */
export function getModuleAbbrevFromInfo(mod: { id: string; name: string }): string {
  if (!mod) return '';
  const abbrev = getModuleAbbreviation(mod.id);
  if (abbrev && abbrev.toUpperCase() !== mod.id.trim().toUpperCase()) {
    return abbrev;
  }
  if (mod.name) {
    const match = mod.name.match(/\(([^)]+)\)/);
    if (match && match[1]) {
      const firstPart = match[1].split('/')[0].trim();
      if (firstPart) return firstPart;
    }
  }
  return abbrev || mod.id;
}

/**
 * Replaces module ID hex numbers in address string (e.g. "726-63-02") with OEM abbreviation (e.g. "BCM-63-02").
 */
export function formatAsBuiltAddressWithAbbrev(address: string): string {
  if (!address) return '';
  const parts = address.split('-');
  if (parts.length >= 2) {
    const abbrev = getModuleAbbreviation(parts[0]);
    return [abbrev, ...parts.slice(1)].join('-');
  }
  return address;
}

/**
 * Converts a Ford As-Built address string (e.g. "706-01-01" or "726-02-02" or "726-63-02" or "DE3E") into standard 2-byte Ford UDS DID hex format.
 * Block numbers in As-Built addresses are 1-based decimal values mapped to 0-based hex DID offsets (e.g. block 01 dec -> DE00, block 02 dec -> DE01, block 63 dec -> 62 dec -> DE3E).
 */
export function asBuiltAddressToDid(address: string): string {
  if (!address) return 'DE00';
  const clean = address.trim().toUpperCase();

  const didMatch = clean.match(/DE[0-9A-F]{2}/i);
  if (didMatch) {
    return didMatch[0].toUpperCase();
  }

  const parts = clean.split('-');
  let blockStr = '';

  if (parts.length === 3) {
    blockStr = parts[1];
  } else if (parts.length === 2) {
    blockStr = parts[0];
  }

  if (blockStr) {
    const blockNum = parseInt(blockStr, 10);
    if (!isNaN(blockNum) && blockNum > 0) {
      const hexOffset = (blockNum - 1).toString(16).padStart(2, '0').toUpperCase();
      return `DE${hexOffset}`;
    }
  }

  return 'DE00';
}

/**
 * Converts a Ford UDS DID hex format (e.g. "DE00", "DE01", "DE3E") and line number into an As-Built address string.
 * The DID hex identifies strictly the block (e.g. DE3E -> 0x3E = block 63), while lineNum specifies the line within that block.
 */
export function didToAsBuiltAddress(moduleId: string, didHex: string, lineNum: number = 1): string {
  const normModule = normalizeModuleId(moduleId);
  const cleanDid = (didHex || '').replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
  let hexOffset = 0;

  if (cleanDid.startsWith('DE') && cleanDid.length >= 4) {
    const hexPart = cleanDid.substring(2, 4);
    const parsed = parseInt(hexPart, 16);
    if (!isNaN(parsed)) hexOffset = parsed;
  } else if (cleanDid.length >= 2) {
    const parsed = parseInt(cleanDid.substring(0, 2), 16);
    if (!isNaN(parsed)) hexOffset = parsed;
  }

  const blockNum = hexOffset + 1;
  const blockStr = blockNum.toString().padStart(2, '0');
  const validLine = lineNum > 0 ? lineNum : 1;
  const lineStr = validLine.toString().padStart(2, '0');
  return `${normModule}-${blockStr}-${lineStr}`;
}



