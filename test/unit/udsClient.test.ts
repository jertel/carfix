import { describe, it, expect } from 'vitest';
import { UdsClient, formatRawCommand } from '../../src/core/obd/udsClient';
import { ObdBridge } from '../../src/core/obd/obdBridge';

describe('UDS Client ISO 14229 Engine', () => {
  it('should request diagnostic session 0x03', async () => {
    const mockBridge = new ObdBridge();
    const client = new UdsClient(mockBridge);

    const result = await client.setDiagnosticSession(0x03);
    expect(result).toBe(true);
  });

  it('should read data by identifier DID', async () => {
    const mockBridge = new ObdBridge();
    const client = new UdsClient(mockBridge);

    const response = await client.readDataByIdentifier('6302');
    expect(response).toContain('62');
  });

  it('should perform ECU soft reset', async () => {
    const mockBridge = new ObdBridge();
    const client = new UdsClient(mockBridge);
    client.isWriteDisabled = false;

    const result = await client.ecuReset(0x03);
    expect(result).toBe(true);
  });

  it('should suppress actual hardware transmission when isWriteDisabled is true', async () => {
    const mockBridge = new ObdBridge();
    const client = new UdsClient(mockBridge);
    client.isWriteDisabled = true;

    const writeResult = await client.writeDataByIdentifier('7D05', '000000402068');
    expect(writeResult).toBe(true);
  });

  it('should default isWriteDisabled to false and transmit write command to bridge', async () => {
    const mockBridge = new ObdBridge();
    mockBridge.setSimulationMode(true);
    const client = new UdsClient(mockBridge);

    expect(client.isWriteDisabled).toBe(false);
    const writeResult = await client.writeDataByIdentifier('7D05', '000000402068');
    expect(writeResult).toBe(true);
  });

  it('should format raw UDS command string into space-separated byte pairs', () => {
    const raw = '2E7D05000000402068';
    const formatted = formatRawCommand(raw);
    expect(formatted).toBe('2E 7D 05 00 00 00 40 20 68');
  });

  it('should send raw unspaced hex command for single-frame writes (<= 7 bytes)', async () => {
    const mockBridge = new ObdBridge();
    mockBridge.setSimulationMode(true);
    let capturedCmd = '';
    mockBridge.sendCommand = async (cmd: string) => {
      capturedCmd = cmd;
      return '726 03 6E 12 34';
    };
    const client = new UdsClient(mockBridge);
    client.isWriteDisabled = false;

    const result = await client.writeDataByIdentifier('1234', '5678', true);
    expect(result).toBe(true);
    expect(capturedCmd).toBe('2E12345678');
  });

  it('should send STPX command for multi-frame writes (> 7 bytes)', async () => {
    const mockBridge = new ObdBridge();
    mockBridge.setSimulationMode(true);
    let capturedCmd = '';
    mockBridge.sendCommand = async (cmd: string) => {
      capturedCmd = cmd;
      return '726 03 6E DE 3E';
    };
    const client = new UdsClient(mockBridge);
    client.isWriteDisabled = false;

    const result = await client.writeDataByIdentifier('DE3E', '04010001030000000101', true);
    expect(result).toBe(true);
    expect(capturedCmd).toBe('STPX D:2EDE3E04010001030000000101');
  });
});
