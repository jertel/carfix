import { normalizeModuleId, parseObdPayloadBytes } from './hexUtils';
import { obdBridge } from '../obd/obdBridge';
import { udsClient } from '../obd/udsClient';

/**
 * Formats timestamp for export filename as YYYYMMDDHHMMSS.
 */
export function formatTimestampYYYYMMDDHHMMSS(date: Date = new Date()): string {
  const yyyy = date.getFullYear().toString();
  const mm = (date.getMonth() + 1).toString().padStart(2, '0');
  const dd = date.getDate().toString().padStart(2, '0');
  const hh = date.getHours().toString().padStart(2, '0');
  const min = date.getMinutes().toString().padStart(2, '0');
  const ss = date.getSeconds().toString().padStart(2, '0');
  return `${yyyy}${mm}${dd}${hh}${min}${ss}`;
}

/**
 * Generates the standardized module export filename (e.g. module-export-726-20260729194521.txt).
 */
export function formatModuleExportFilename(moduleId: string, date: Date = new Date()): string {
  const normModule = normalizeModuleId(moduleId);
  const timestamp = formatTimestampYYYYMMDDHHMMSS(date);
  return `module-export-${normModule}-${timestamp}.txt`;
}

/**
 * Formats payload data bytes into hyphenated hex string (e.g. "ABCD-EFAB-CD" for 5 bytes, "01" for 1 byte).
 */
export function formatFiveByteHexChunk(bytes: number[]): string {
  if (!bytes || bytes.length === 0) return '';
  const hexTokens = bytes.map(b => b.toString(16).padStart(2, '0').toUpperCase());
  if (hexTokens.length <= 2) {
    return hexTokens.join('');
  } else if (hexTokens.length <= 4) {
    const part1 = hexTokens.slice(0, 2).join('');
    const part2 = hexTokens.slice(2).join('');
    return `${part1}-${part2}`;
  } else {
    const part1 = hexTokens.slice(0, 2).join('');
    const part2 = hexTokens.slice(2, 4).join('');
    const part3 = hexTokens.slice(4, 5).join('');
    return `${part1}-${part2}-${part3}`;
  }
}

/**
 * Exports all blocks and lines from a vehicle module starting at DID DE00 sequentially up to DEFF
 * until consecutive failure limits are reached.
 * Formats output lines as: "726-01-01 ABCD-EFAB-CD"
 */
export async function generateModuleAsBuiltExportText(
  moduleId: string,
  onProgress?: (currentAddress: string) => void
): Promise<{ filename: string; content: string; lineCount: number }> {
  const normModule = normalizeModuleId(moduleId);
  const filename = formatModuleExportFilename(normModule);
  const lines: string[] = [];

  if (!obdBridge.isSimulationMode() && obdBridge.isConnected()) {
    await obdBridge.setHeader(normModule);
    await udsClient.setDiagnosticSession(0x03);

    try {
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 10;

      for (let blockIndex = 1; blockIndex <= 256; blockIndex++) {
        const didOffset = blockIndex - 1;
        const blockHex = didOffset.toString(16).padStart(2, '0').toUpperCase();
        const blockStr = blockIndex.toString().padStart(2, '0');
        const didHex = `DE${blockHex}`;

        try {
          const rawData = await udsClient.readDataByIdentifier(didHex);

          if (rawData && rawData !== 'NO_DATA' && !/ERROR|UNABLE|STOPPED|7F/i.test(rawData)) {
            consecutiveFailures = 0;
            const payloadBytes = parseObdPayloadBytes(rawData);

            if (payloadBytes.length > 0) {
              const numLines = Math.ceil(payloadBytes.length / 5);
              for (let lineNum = 1; lineNum <= numLines; lineNum++) {
                const lineStr = lineNum.toString().padStart(2, '0');
                const address = `${normModule}-${blockStr}-${lineStr}`;
                const chunk = payloadBytes.slice((lineNum - 1) * 5, lineNum * 5);
                if (chunk.length > 0) {
                  const formattedBytes = formatFiveByteHexChunk(chunk);
                  lines.push(`${address} ${formattedBytes}`);

                  if (onProgress) {
                    onProgress(address);
                  }
                }
              }
            }
          } else {
            consecutiveFailures++;
            if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
              break;
            }
          }
        } catch {
          consecutiveFailures++;
          if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
            break;
          }
        }
      }
    } finally {
      await udsClient.setDiagnosticSession(0x01);
    }
  } else {
    // Simulation / Offline Mode Engine
    const simBlocks = (normModule === '726') ? 70 : (normModule === '7D0') ? 25 : 10;
    for (let block = 1; block <= simBlocks; block++) {
      const blockStr = block.toString().padStart(2, '0');
      for (let line = 1; line <= 2; line++) {
        const lineStr = line.toString().padStart(2, '0');
        const address = `${normModule}-${blockStr}-${lineStr}`;
        lines.push(`${address} 0000-0000-00`);
        if (onProgress) {
          onProgress(address);
        }
      }
    }
  }

  return {
    filename,
    content: lines.join('\n'),
    lineCount: lines.length
  };
}
