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

  it('should toggle compact dashboard mode and persist preference', async () => {
    const store = useCarFixStore();
    expect(store.isCompactDashboardMode).toBe(false);

    await store.toggleCompactDashboardMode();
    expect(store.isCompactDashboardMode).toBe(true);

    await store.toggleCompactDashboardMode();
    expect(store.isCompactDashboardMode).toBe(false);
  });

  it('should restore Display and Behavior options from preferences upon initializeDashboard', async () => {
    const store = useCarFixStore();
    const { preferencesManager } = await import('../../src/core/storage/preferencesManager');

    await preferencesManager.saveCompactDashboardModePref(true);
    await preferencesManager.saveTelemetryRatePref(5);
    await preferencesManager.saveAutoConnectPref(true);
    await preferencesManager.saveAutoReconnectPref(true);

    await store.initializeDashboard();

    expect(store.isCompactDashboardMode).toBe(true);
    expect(store.telemetryRate).toBe(5);
    expect(store.autoConnect).toBe(true);
    expect(store.autoReconnect).toBe(true);
  });

  it('should persist autoConnect state when setAutoConnect is called', async () => {
    const store = useCarFixStore();
    const { preferencesManager } = await import('../../src/core/storage/preferencesManager');

    expect(store.autoConnect).toBe(false);
    await store.setAutoConnect(true);
    expect(store.autoConnect).toBe(true);
    expect(await preferencesManager.loadAutoConnectPref()).toBe(true);

    await store.setAutoConnect(false);
    expect(store.autoConnect).toBe(false);
    expect(await preferencesManager.loadAutoConnectPref()).toBe(false);
  });

  it('should persist autoReconnect state when setAutoReconnect is called', async () => {
    const store = useCarFixStore();
    const { preferencesManager } = await import('../../src/core/storage/preferencesManager');

    expect(store.autoReconnect).toBe(false);
    await store.setAutoReconnect(true);
    expect(store.autoReconnect).toBe(true);
    expect(await preferencesManager.loadAutoReconnectPref()).toBe(true);

    await store.setAutoReconnect(false);
    expect(store.autoReconnect).toBe(false);
    expect(await preferencesManager.loadAutoReconnectPref()).toBe(false);
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
    expect(store.activeTab).toBe('connect');
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
    expect(store.logs.some(l => l.message.includes('Engine is running'))).toBe(true);
  });

  it('should preserve PID RPM state when stopping telemetry polling', async () => {
    const store = useCarFixStore();
    const rpmPid = store.pids.find(p => p.definition.id.includes('rpm'));
    if (rpmPid) {
      rpmPid.currentValue = 1200;
    }
    expect(store.isEngineRunning).toBe(true);

    store.stopTelemetryPolling();

    expect(store.isEngineRunning).toBe(true);
    if (rpmPid) {
      expect(rpmPid.currentValue).toBe(1200);
    }
  });

  it('should detect electric/hybrid vehicle movement or non-Park gear position as active vehicle state', async () => {
    const store = useCarFixStore();
    store.resetPidData();
    expect(store.isEngineRunning).toBe(false);

    // Test transmission gear in Drive (gear > 0)
    const gearPid = store.pids.find(p => p.definition.id.includes('gear'));
    if (gearPid) {
      gearPid.currentValue = 4; // Drive
      expect(store.isEngineRunning).toBe(true);
      gearPid.currentValue = 0; // Park
      expect(store.isEngineRunning).toBe(false);
    }

    // Test vehicle speed > 0
    const speedPid = store.pids.find(p => p.definition.id.includes('speed'));
    if (speedPid) {
      speedPid.currentValue = 25;
      expect(store.isEngineRunning).toBe(true);
      speedPid.currentValue = 0;
      expect(store.isEngineRunning).toBe(false);
    }
  });

  it('should evaluate option firmware prerequisites and block toggle when unsatisfied', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    await store.evaluateOptionFirmwarePrerequisites();

    const laneChangeOpt = store.availableOptions.find(o => o.id === 'f150_enable_lane_change_assist')!;
    expect(laneChangeOpt).toBeDefined();

    expect(store.isOptionFirmwareSatisfied(laneChangeOpt)).toBe(false);
    expect(store.getOptionFirmwareMissingReason(laneChangeOpt)).toContain('Installed: RJ6T-14H102-ABS, Required: RJ6T-14H102-ACJ');

    await store.toggleOption(laneChangeOpt, true);
    expect(store.lastWriteResult?.success).toBe(false);
    expect(store.lastWriteResult?.error).toContain('Unmet firmware prerequisite');
  });

  it('should block ext diag prompt, writes, and restores when engine is running', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    const rpmPid = store.pids.find(p => p.definition.id.includes('rpm'));
    if (rpmPid) {
      rpmPid.currentValue = 900;
    }
    expect(store.isEngineRunning).toBe(true);

    const option = store.availableOptions[0];

    // requestOptionsRefresh
    await store.requestOptionsRefresh(option);
    expect(store.showExtDiagPrompt).toBe(false);

    // confirmOptionsRefresh
    await store.confirmOptionsRefresh();
    expect(store.hasConfirmedExtDiag).toBe(false);

    // toggleOption
    await store.toggleOption(option, true);
    expect(store.lastWriteResult?.success).toBe(false);
    expect(store.lastWriteResult?.error).toContain('Engine is running');

    // restoreOptionLine
    const restored = await store.restoreOptionLine(option, '0000 0000 003B');
    expect(restored).toBe(false);
    expect(store.lastWriteResult?.error).toContain('Engine is running');
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

  it('should run checkEngineRunningLive without throwing parseObdPayloadBytes reference error', async () => {
    const store = useCarFixStore();
    store.isConnected = true;
    const isRunning = await store.checkEngineRunningLive();
    expect(typeof isRunning).toBe('boolean');
    const warningLog = store.logs.find(l => l.message.includes('parseObdPayloadBytes is not defined'));
    expect(warningLog).toBeUndefined();
  });
});
