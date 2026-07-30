import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { obdBridge } from '../../src/core/obd/obdBridge';
import { backupManager } from '../../src/core/safety/backupManager';
import { preferencesManager } from '../../src/core/storage/preferencesManager';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('Persistent Line History & Debug Logging System', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should capture raw TX and RX traffic in debug logging mode', async () => {
    const store = useCarFixStore();
    store.setupObdLogging();

    await store.setDebugLogging(true);
    expect(store.isDebugLoggingEnabled).toBe(true);

    obdBridge.setSimulationMode(true);
    await obdBridge.connect({ adapterName: 'Demo', connectionType: 'BLUETOOTH_CLASSIC', macOrUuid: 'DEMO_MODE' });

    await obdBridge.sendCommand('220101');

    const txLog = store.logs.find(l => l.message.includes('TX: 220101'));
    const rxLog = store.logs.find(l => l.message.includes('RX:'));

    expect(txLog).toBeDefined();
    expect(rxLog).toBeDefined();
  });

  it('should store log entries past the legacy 200 item cap', () => {
    const store = useCarFixStore();
    store.clearLogs();

    for (let i = 0; i < 350; i++) {
      store.addLog('INF', `Test log message ${i}`);
    }

    expect(store.logs.length).toBe(350);
  });

  it('should persist line history to device storage and reload them across restarts', async () => {
    const targetAddress = '7D0-01-01';
    const hexVal = '0000 0000 006A';

    backupManager.recordLineBackup(targetAddress, hexVal);

    const history = backupManager.getLineHistory(targetAddress);
    expect(history.length).toBeGreaterThan(0);

    const map = backupManager.getAllLineHistories();
    await preferencesManager.saveLineHistory(map);

    const loaded = await preferencesManager.loadLineHistory();
    expect(loaded[targetAddress]).toBeDefined();
    expect(loaded[targetAddress][0].hexValue).toBe(hexVal);
  });
});
