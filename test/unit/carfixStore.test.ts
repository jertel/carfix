import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { backupManager } from '../../src/core/safety/backupManager';

describe('CarFix Pinia Store Telemetry & Line Control Engine', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should cycle active tab using nextTab and prevTab actions', () => {
    const store = useCarFixStore();
    expect(store.activeTab).toBe('connect');

    store.nextTab();
    expect(store.activeTab).toBe('pids');

    store.nextTab();
    expect(store.activeTab).toBe('options');

    store.nextTab();
    expect(store.activeTab).toBe('modules');

    store.prevTab();
    expect(store.activeTab).toBe('options');

    store.prevTab();
    expect(store.activeTab).toBe('pids');

    store.prevTab();
    expect(store.activeTab).toBe('connect');
  });

  it('should toggle compact dashboard mode', () => {
    const store = useCarFixStore();
    expect(store.isCompactDashboardMode).toBe(false);

    store.toggleCompactDashboardMode();
    expect(store.isCompactDashboardMode).toBe(true);

    store.toggleCompactDashboardMode();
    expect(store.isCompactDashboardMode).toBe(false);
  });

  it('should start up in disconnected state with empty demo data and empty availableOptions', () => {
    const store = useCarFixStore();
    expect(store.isConnecting).toBe(false);
    expect(store.isConnected).toBe(false);
    expect(store.connectedVin).toBe('');
    expect(store.activeDtcs).toEqual([]);
    expect(store.detectedModules).toEqual([]);
    expect(store.isSimulationMode).toBe(false);
    expect(store.availableOptions).toEqual([]);
  });

  it('should include Demo Mode in paired devices list and connect in simulation mode when DEMO_MODE selected', async () => {
    const store = useCarFixStore();
    await store.fetchPairedDevices();

    expect(store.pairedDevices.some(d => d.address === 'DEMO_MODE')).toBe(true);

    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    expect(store.isConnected).toBe(true);
    expect(store.isSimulationMode).toBe(true);
    expect(store.connectedVin).toBe('1FTFW1ED4MF123456');
    expect(store.activeDtcs.length).toBeGreaterThan(0);
    expect(store.availableOptions.length).toBeGreaterThan(0);
  });

  it('should reset store state and PID values upon disconnection', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    // Verify options are NOT automatically read on connect
    expect(Object.keys(store.moduleData).length).toBe(0);

    // Read single option line on-demand
    await store.readOptionLine(store.availableOptions[0]);
    expect(Object.keys(store.moduleData).length).toBeGreaterThan(0);

    // Populate dummy values & history
    store.pids[0].currentValue = 88;
    store.pids[0].history.push({ timestampISO: new Date().toISOString(), value: 88 });

    await store.disconnectAdapter();
    expect(store.isConnected).toBe(false);
    expect(store.connectedVin).toBe('');
    expect(store.moduleData).toEqual({});
    expect(store.activeDtcs).toEqual([]);
    expect(store.detectedModules).toEqual([]);
    expect(store.isSimulationMode).toBe(false);
    expect(store.availableOptions).toEqual([]);
    expect(store.pids.every(p => p.currentValue === p.definition.minValue)).toBe(true);
    expect(store.pids.every(p => p.history.length === 0)).toBe(true);
    expect(store.logs.some(l => l.message === 'User disconnected')).toBe(true);
    expect(store.logs.some(l => l.message === 'Lost connection')).toBe(false);
  });

  it('should detect engine running status and prevent single option reading when engine is running', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    expect(store.isEngineRunning).toBe(false);

    // Set RPM PID to 850 RPM
    const rpmPid = store.pids.find(p => p.definition.id.includes('rpm'));
    expect(rpmPid).toBeDefined();
    if (rpmPid) {
      rpmPid.currentValue = 850;
    }

    expect(store.isEngineRunning).toBe(true);

    // Attempt single option read while engine is running
    await store.readOptionLine(store.availableOptions[0]);
    expect(store.optionLoadingMap[store.availableOptions[0].id]).toBe(false);
  });

  it('should reorder PID cards when dragged and dropped', async () => {
    const store = useCarFixStore();
    await store.initializeDashboard();

    const originalFirst = store.sortedPids[0].definition.id;
    const originalSecond = store.sortedPids[1].definition.id;

    await store.insertPidAtTarget(originalFirst, originalSecond, 'after');

    expect(store.sortedPids[1].definition.id).toBe(originalFirst);
  });

  it('should add new SAE PID to dashboard and persist state', async () => {
    const store = useCarFixStore();
    await store.initializeDashboard();

    const initialLength = store.pids.length;
    await store.addPidToDashboard('sae_015c_engine_oil_temp');

    expect(store.pids.length).toBe(initialLength + 1);
    expect(store.pids.some(p => p.definition.id === 'sae_015c_engine_oil_temp')).toBe(true);
  });

  it('should remove PID from dashboard and persist state', async () => {
    const store = useCarFixStore();
    await store.initializeDashboard();

    const targetId = store.pids[0].definition.id;
    const initialLength = store.pids.length;

    await store.removePidFromDashboard(targetId);

    expect(store.pids.length).toBe(initialLength - 1);
    expect(store.pids.some(p => p.definition.id === targetId)).toBe(false);
  });

  it('should restore saved selected device address when paired devices are fetched', async () => {
    const store = useCarFixStore();
    await store.setSelectedDeviceAddress('DEMO_MODE');
    expect(store.selectedDeviceAddress).toBe('DEMO_MODE');

    // Re-initialize pinia store to simulate app reload
    const newStore = useCarFixStore();
    expect(newStore.selectedDeviceAddress).toBe('');

    await newStore.fetchPairedDevices();
    expect(newStore.selectedDeviceAddress).toBe('DEMO_MODE');
  });

  it('should mark all PIDs as available in simulation mode during baseline check', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    expect(store.pids.every(p => p.isAvailable === true)).toBe(true);
  });

  it('should read individual option line and update moduleData', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    const option = store.availableOptions[0];
    if (option) {
      await store.readOptionLine(option);
      expect(store.moduleData[option.targetAddress]).toBeDefined();
    }
  });

  it('should backup pre-write target line hex when toggling an option', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    const option = store.availableOptions[0];
    if (option) {
      await store.toggleOption(option, true);
      const history = backupManager.getLineHistory(option.targetAddress);
      expect(history.length).toBeGreaterThan(0);
    }
  });

  it('should restore line hex value to option line via store action', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    const option = store.availableOptions[0];
    if (option) {
      const restored = await store.restoreOptionLine(option, '0000 0000 003B');
      expect(restored).toBe(true);
    }
  });
});
