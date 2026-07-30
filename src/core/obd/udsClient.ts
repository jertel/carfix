import { ObdBridge, obdBridge } from './obdBridge';

export interface ISimulatedTransmit {
  module: string;
  address: string;
  didHex: string;
  udsService: string;
  rawCommand: string;
  formattedCommand: string;
  previousHex: string;
  newHex: string;
  timestampISO: string;
}

export function formatRawCommand(raw: string): string {
  const clean = raw.replace(/\s+/g, '');
  const matches = clean.match(/.{1,2}/g);
  return matches ? matches.join(' ') : raw;
}

/**
 * UDS (ISO 14229) Service Client for Ford Module Communication
 */
export class UdsClient {
  private bridge: ObdBridge;
  public isWriteDisabled: boolean = false;

  constructor(bridge: ObdBridge = obdBridge) {
    this.bridge = bridge;
  }

  /**
   * Diagnostic Session Control (Service 0x10)
   * sessionType: 0x01 = Default, 0x03 = Extended Diagnostic Session
   */
  public async setDiagnosticSession(sessionType: number = 0x03): Promise<boolean> {
    const sessionHex = sessionType.toString(16).padStart(2, '0');
    const response = await this.bridge.sendCommand(`10${sessionHex}`);
    return response.includes('50') || response.includes('OK');
  }

  /**
   * Read Data By Identifier (Service 0x22)
   */
  public async readDataByIdentifier(didHex: string): Promise<string> {
    const response = await this.bridge.sendCommand(`22${didHex}`);
    return response;
  }

  /**
   * Write Data By Identifier (Service 0x2E)
   */
  public async writeDataByIdentifier(didHex: string, payloadHex: string): Promise<boolean> {
    const cleanPayload = payloadHex.replace(/\s+/g, '');
    const rawCommand = `2E${didHex}${cleanPayload}`;

    if (this.isWriteDisabled) {
      console.log(`[TROUBLESHOOTING MODE] Suppressed actual ECU module write for command: ${rawCommand}`);
      return true;
    }

    // Ensure Extended Session is active
    await this.setDiagnosticSession(0x03);

    const response = await this.bridge.sendCommand(rawCommand);
    
    // UDS positive response for 0x2E is 0x6E
    return response.includes('6E') || response.includes('OK');
  }

  /**
   * ECU Reset (Service 0x11)
   * resetType: 0x01 = Hard Reset, 0x03 = Soft Reset
   */
  public async ecuReset(resetType: number = 0x03): Promise<boolean> {
    if (this.isWriteDisabled) {
      console.log('[TROUBLESHOOTING MODE] Suppressed ECU reset after write');
      return true;
    }
    const resetHex = resetType.toString(16).padStart(2, '0');
    const response = await this.bridge.sendCommand(`11${resetHex}`);
    return response.includes('51') || response.includes('OK');
  }
}

export const udsClient = new UdsClient();
