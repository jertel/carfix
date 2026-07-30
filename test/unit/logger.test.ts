import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('Diagnostic Logger Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should initialize with empty logs array', () => {
    const store = useCarFixStore();
    expect(store.logs).toEqual([]);
  });

  it('should add log entries with levels INF, WRN, ERR and timestamp', () => {
    const store = useCarFixStore();
    store.addLog('INF', 'Connecting');
    store.addLog('WRN', 'Lost connection');
    store.addLog('ERR', 'Failed to read PID 224809');

    expect(store.logs.length).toBe(3);
    expect(store.logs[0].level).toBe('INF');
    expect(store.logs[0].message).toBe('Connecting');
    expect(store.logs[1].level).toBe('WRN');
    expect(store.logs[1].message).toBe('Lost connection');
    expect(store.logs[2].level).toBe('ERR');
    expect(store.logs[2].message).toBe('Failed to read PID 224809');
    expect(store.logs[0].timestampISO).toBeDefined();
  });

  it('should clear logs when clearLogs action is executed', () => {
    const store = useCarFixStore();
    store.addLog('INF', 'Connecting');
    store.addLog('INF', 'Connected');
    expect(store.logs.length).toBe(2);

    store.clearLogs();
    expect(store.logs).toEqual([]);
  });

  it('should automatically append logs during connect and disconnect workflows', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    expect(store.logs.some(l => l.level === 'INF' && l.message.includes('Connecting'))).toBe(true);
    expect(store.logs.some(l => l.level === 'INF' && l.message.includes('Connected'))).toBe(true);

    await store.disconnectAdapter();
    expect(store.logs.some(l => l.level === 'INF' && l.message.includes('User disconnected'))).toBe(true);
  });
});
