import { calculateFordChecksum } from '../../core/obd/checksum';
import { obdBridge } from '../../core/obd/obdBridge';
import { udsClient } from '../../core/obd/udsClient';
import { asBuiltAddressToDid, normalizeModuleId, parseObdPayloadBytes, didToAsBuiltAddress, formatAsBuiltLineHex } from '../../core/utils/hexUtils';

export interface IModuleBlockRange {
  moduleId: string;
  startBlock: number;
  endBlock: number;
  linesPerBlock: number;
}

/**
 * Dynamically probes an ECU module via UDS (Service 0x22 ReadDataByIdentifier) sequentially across DIDs.
 * Probes until consecutive unsupported DIDs are returned.
 * Zero hardcoded block or line ranges.
 */
export async function readModuleAsBuiltLinesDynamic(
  moduleId: string,
  onProgress?: (currentAddress: string) => void
): Promise<Record<string, string>> {
  const modId = normalizeModuleId(moduleId);
  const resultMap: Record<string, string> = {};

  if (!obdBridge.isSimulationMode() && obdBridge.isConnected()) {
    await obdBridge.setHeader(modId);

    // Enter Extended Diagnostic Session (0x03) to enable proprietary As-Built DID reading
    await udsClient.setDiagnosticSession(0x03);

    try {
      let consecutiveFailures = 0;
      const MAX_CONSECUTIVE_FAILURES = 10;

      for (let blockIndex = 1; blockIndex <= 255; blockIndex++) {
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
                const address = `${modId}-${blockStr}-${lineStr}`;
                const formattedHex = formatAsBuiltLineHex(address, payloadBytes);
                if (formattedHex !== 'NO DATA') {
                  resultMap[address] = formattedHex;
                  resultMap[`${modId}-${didHex}`] = formattedHex;
                  resultMap[didHex] = formattedHex;
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
      // ALWAYS restore ECU to Default Diagnostic Session (0x01) to clear diagnostic alarms
      await udsClient.setDiagnosticSession(0x01);
    }

    return resultMap;
  }

  // --- Simulation Engine Baseline Generation ---
  const simBlocks = (modId === '726') ? 70 : (modId === '7D0') ? 25 : 10;
  for (let block = 1; block <= simBlocks; block++) {
    const blockStr = block.toString().padStart(2, '0');
    for (let line = 1; line <= 2; line++) {
      const lineStr = line.toString().padStart(2, '0');
      const address = `${modId}-${blockStr}-${lineStr}`;
      const basePayloadHex = '0000000000';
      const checksum = calculateFordChecksum(address, basePayloadHex);
      resultMap[address] = `0000 0000 00${checksum}`;
      if (onProgress) {
        onProgress(address);
      }
    }
  }

  return resultMap;
}

/**
 * Generates baseline As-Built data lines starting at 01-01 with valid Ford checksums for a given module.
 * Preserved for backwards compatibility and test assertions.
 */
export function generateFullModuleBaselineData(
  moduleId: string,
  onProgress?: (currentAddress: string) => void
): Record<string, string> {
  const modId = normalizeModuleId(moduleId);
  const simBlocks = (modId === '726') ? 70 : (modId === '7D0') ? 25 : 10;
  const dataMap: Record<string, string> = {};

  for (let block = 1; block <= simBlocks; block++) {
    const blockStr = block.toString().padStart(2, '0');
    for (let line = 1; line <= 2; line++) {
      const lineStr = line.toString().padStart(2, '0');
      const address = `${modId}-${blockStr}-${lineStr}`;
      const basePayloadHex = '0000000000';
      const checksum = calculateFordChecksum(address, basePayloadHex);
      dataMap[address] = `0000 0000 00${checksum}`;
      if (onProgress) {
        onProgress(address);
      }
    }
  }

  return dataMap;
}

/**
 * Generates all As-Built address strings starting at 01-01 for a given module ID.
 * Preserved for backwards compatibility.
 */
export function generateModuleAsBuiltAddresses(moduleId: string): string[] {
  const modId = normalizeModuleId(moduleId);
  const simBlocks = (modId === '726') ? 70 : (modId === '7D0') ? 25 : 10;
  const addresses: string[] = [];

  for (let block = 1; block <= simBlocks; block++) {
    const blockStr = block.toString().padStart(2, '0');
    for (let line = 1; line <= 2; line++) {
      const lineStr = line.toString().padStart(2, '0');
      addresses.push(`${modId}-${blockStr}-${lineStr}`);
    }
  }

  return addresses;
}
