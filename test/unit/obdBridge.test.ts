import { describe, it, expect, beforeEach } from 'vitest';
import { ObdBridge } from '../../src/core/obd/obdBridge';

describe('OBD Bridge Hardware & Simulation Layer', () => {
  let bridge: ObdBridge;

  beforeEach(() => {
    bridge = new ObdBridge();
  });

  it('should default simulation mode to false', () => {
    expect(bridge.isSimulationMode()).toBe(false);
    expect(bridge.isConnected()).toBe(false);
  });

  it('should initialize connection sequence when DEMO_MODE is selected', async () => {
    const connected = await bridge.connect({
      adapterName: 'Demo Mode',
      connectionType: 'BLUETOOTH_CLASSIC',
      macOrUuid: 'DEMO_MODE'
    });

    expect(connected).toBe(true);
    expect(bridge.isConnected()).toBe(true);
    expect(bridge.isSimulationMode()).toBe(true);
  });

  it('should format ATSH header commands in simulation mode', async () => {
    await bridge.connect({
      adapterName: 'Demo Mode',
      connectionType: 'BLUETOOTH_CLASSIC',
      macOrUuid: 'DEMO_MODE'
    });

    const setHeaderOk = await bridge.setHeader('706');
    expect(setHeaderOk).toBe(true);
  });

  it('should return simulated UDS read responses for DID 6302 in simulation mode', async () => {
    await bridge.connect({
      adapterName: 'Demo Mode',
      connectionType: 'BLUETOOTH_CLASSIC',
      macOrUuid: 'DEMO_MODE'
    });
    await bridge.setHeader('726');
    const response = await bridge.sendCommand('226302');

    expect(response).toContain('726');
    expect(response).toContain('62 6302');
  });

  it('should fetch paired devices list', async () => {
    const devices = await bridge.getPairedDevices();
    expect(Array.isArray(devices)).toBe(true);
  });

  it('should fail non-demo connection when native hardware plugin is unavailable', async () => {
    await expect(bridge.connect({
      adapterName: 'Real Adapter',
      connectionType: 'BLUETOOTH_CLASSIC',
      macOrUuid: '00:11:22:33:44:55'
    })).rejects.toThrow();
    expect(bridge.isConnected()).toBe(false);
    expect(bridge.isSimulationMode()).toBe(false);
  });

  it('should disconnect adapter clean state and reset simulation mode immediately', async () => {
    await bridge.connect({
      adapterName: 'Demo Mode',
      connectionType: 'BLUETOOTH_CLASSIC',
      macOrUuid: 'DEMO_MODE'
    });

    await bridge.disconnect();
    expect(bridge.isConnected()).toBe(false);
    expect(bridge.isSimulationMode()).toBe(false);
    await expect(bridge.sendCommand('010C')).rejects.toThrow('OBD Adapter not connected or simulation mode disabled.');
  });
});
