import { Capacitor, registerPlugin } from '@capacitor/core';
import { hexToAscii, parseObdPayloadBytes } from '../utils/hexUtils';

export interface IObdBridgeNativePlugin {
  connect(options: { address?: string; protocol?: string }): Promise<{ connected: boolean; adapter: string; address?: string }>;
  sendRawCommand(options: { command: string; timeoutMs?: number }): Promise<{ response: string; command: string }>;
  disconnect(): Promise<{ connected: boolean }>;
  getPairedDevices(): Promise<{ devices: Array<{ name: string; address: string }> }>;
}

const NativeObdBridge = registerPlugin<IObdBridgeNativePlugin>('ObdBridge');

export interface IObdAdapterConfig {
  adapterName: string;
  connectionType: 'BLUETOOTH_CLASSIC' | 'BLE' | 'USB';
  macOrUuid: string;
}

export class ObdBridge {
  private connected: boolean = false;
  private currentHeader: string = '726';
  private useSimulationMode: boolean = false;
  public onCommandLogged?: (direction: 'TX' | 'RX', payload: string) => void;

  public setSimulationMode(simulation: boolean): void {
    this.useSimulationMode = simulation;
  }

  public isSimulationMode(): boolean {
    return this.useSimulationMode;
  }

  public async getPairedDevices(): Promise<Array<{ name: string; address: string }>> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeObdBridge.getPairedDevices();
        if (res && res.devices && res.devices.length > 0) {
          return res.devices;
        }
      } catch (err) {
        console.warn('Native getPairedDevices failed:', err);
      }
    }
    return [];
  }

  /**
   * Initializes hardware connection sequence for OBDLink MX+ (STN22xx chip) or Demo Mode
   */
  public async connect(config: IObdAdapterConfig): Promise<boolean> {
    if (config.macOrUuid === 'DEMO_MODE') {
      this.useSimulationMode = true;
      this.connected = true;
      return true;
    }

    this.useSimulationMode = false;

    if (Capacitor.isNativePlatform()) {
      try {
        const res = await NativeObdBridge.connect({ address: config.macOrUuid });
        this.connected = res.connected;
      } catch (err) {
        console.warn('Native connection failed:', err);
        this.connected = false;
        throw new Error('Failed to connect to Bluetooth OBD adapter.');
      }
    } else {
      throw new Error('Native hardware connection is only available on mobile devices. Please select Demo Mode.');
    }

    // Handshake initialization sequence for OBDLink MX+ & Ford CAN-FD
    if (this.connected) {
      this.currentHeader = '';
      const initCommands = [
        'ATZ',      // Reset adapter
        'ATE0',     // Echo off
        'ATL0',     // Linefeeds off
        'ATH1',     // Headers on
        'ATSP6',    // Set protocol ISO 15765-4 11bit 500kbps
        'STP6'      // STN CAN-FD protocol mode (no space)
      ];

      for (const cmd of initCommands) {
        await this.sendCommand(cmd);
      }
    }

    return this.connected;
  }

  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Sets CAN transmit header ID e.g. "726" (BCM) or "706" (IPMA)
   */
  public async setHeader(headerHex: string): Promise<boolean> {
    if (!this.connected && !this.useSimulationMode) {
      return false;
    }
    if (this.currentHeader === headerHex) {
      return true;
    }
    this.currentHeader = headerHex;
    if (this.useSimulationMode) {
      return true;
    }
    const response = await this.sendCommand(`ATSH${headerHex}`);
    return response.includes('OK');
  }

  /**
   * Transmits command to OBDLink MX+ adapter via native hardware plugin or simulation engine
   */
  public async sendCommand(cmd: string, timeoutMs: number = 3000): Promise<string> {
    if (!this.connected && !this.useSimulationMode) {
      throw new Error('OBD Adapter not connected or simulation mode disabled.');
    }

    this.onCommandLogged?.('TX', cmd);
    let res = '';

    if (!this.useSimulationMode && Capacitor.isNativePlatform()) {
      try {
        const nativeRes = await NativeObdBridge.sendRawCommand({ command: cmd, timeoutMs });
        res = nativeRes.response || '';
      } catch (err) {
        console.error('Native send error:', err);
        throw err;
      }
    } else if (this.useSimulationMode) {
      // Simulation Engine Mode (For Browser & Unit Testing)
      if (cmd.startsWith('ATSH')) res = 'OK';
      else if (cmd === 'ATZ') res = 'ELM327 v2.2 / STN2255 OBDLink MX+';
      else if (cmd === '0902') {
        res = '49 02 01 00 00 00 31 49 02 02 46 54 46 57 31 45 44 34 4D 46 31 32 33 34 35 36';
      } else if (cmd.replace(/\s+/g, '').startsWith('22')) {
        const cleanCmd = cmd.replace(/\s+/g, '');
        const did = cleanCmd.substring(2);
        if (did === 'F113') res = '706 10 62 F1 13 4D 4C 33 54 2D 31 34 47 36 34 37 2D 41 42'; // ML3T-14G647-AB
        else res = `${this.currentHeader} 07 62 ${did} 04 01 01 00 00 98`;
      } else if (cmd.startsWith('STPX') || cmd.replace(/\s+/g, '').startsWith('2E')) {
        const cleanCmd = cmd.replace(/.*D:\s*/i, '').replace(/\s+/g, '');
        res = `${this.currentHeader} 03 6E ${cleanCmd.substring(2, 6)}`;
      } else if (cmd.startsWith('10') || cmd.startsWith('11')) {
        res = 'OK';
      } else {
        res = 'OK';
      }
    } else {
      throw new Error('OBD Adapter not connected or simulation mode disabled.');
    }

    this.onCommandLogged?.('RX', res);
    return res;
  }

  public async disconnect(): Promise<void> {
    const isSim = this.useSimulationMode;
    this.connected = false;
    this.useSimulationMode = false;
    if (!isSim && Capacitor.isNativePlatform()) {
      try {
        await NativeObdBridge.disconnect();
      } catch (ignored) {}
    }
  }
}

/**
 * Robust ISO 15765-4 multi-frame VIN parser for Mode 09 02 responses and UDS F190.
 */
export function parseVinResponseHex(rawResponse: string): string {
  if (!rawResponse) return '';

  // Check if string is already a direct 17-char VIN
  const directMatch = rawResponse.match(/\b[A-HJ-NPR-Z0-9]{17}\b/);
  if (directMatch) return directMatch[0];

  const asciiStr = hexToAscii(rawResponse);
  const vinMatch = asciiStr.match(/[A-HJ-NPR-Z0-9]{17}/);
  if (vinMatch) return vinMatch[0];

  // Fallback: extract payload bytes and convert printable chars
  const payloadBytes = parseObdPayloadBytes(rawResponse);
  let fallbackStr = '';
  for (const b of payloadBytes) {
    if (b >= 32 && b <= 126) {
      fallbackStr += String.fromCharCode(b);
    }
  }
  const fallbackMatch = fallbackStr.match(/[A-HJ-NPR-Z0-9]{17}/);
  return fallbackMatch ? fallbackMatch[0] : '';
}

export const obdBridge = new ObdBridge();

