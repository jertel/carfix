import { describe, it, expect, beforeEach } from 'vitest';
import { preferencesManager, IPidPreferenceItem } from '../../src/core/storage/preferencesManager';

describe('Capacitor Preferences Manager', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('should save and load unified dashboard preferences in a single key', async () => {
    const preferences: IPidPreferenceItem[] = [
      { id: 'sae_010c_rpm', viewMode: 'GRAPH' },
      { id: 'sae_010d_speed', viewMode: 'READOUT' },
      { id: 'ford_12v_battery_soc', viewMode: 'READOUT' }
    ];

    await preferencesManager.saveDashboardPreferences(preferences);

    const loaded = await preferencesManager.loadDashboardPreferences();
    expect(loaded).toEqual(preferences);
    expect(loaded.length).toBe(3);
    expect(loaded[0].id).toBe('sae_010c_rpm');
    expect(loaded[0].viewMode).toBe('GRAPH');
  });

  it('should save and load last selected device address', async () => {
    expect(await preferencesManager.loadLastDeviceAddress()).toBe('');

    await preferencesManager.saveLastDeviceAddress('00:11:22:33:44:55');
    const loaded = await preferencesManager.loadLastDeviceAddress();
    expect(loaded).toBe('00:11:22:33:44:55');
  });

  it('should save, load, and delete backup payload and update index', async () => {
    const dummyBackup = {
      id: 'backup_726_12345',
      vehicleVin: '1FTFW1ED4MF123456',
      timestampISO: new Date().toISOString(),
      timezone: 'America/New_York',
      moduleId: '726',
      asBuiltLines: { '726-01-01': '0000 0000 006A' }
    };

    await preferencesManager.saveBackupPayload(dummyBackup);
    let allBackups = await preferencesManager.loadAllBackupPayloads();
    expect(allBackups.length).toBe(1);
    expect(allBackups[0].id).toBe('backup_726_12345');

    await preferencesManager.deleteBackupPayload('backup_726_12345');
    allBackups = await preferencesManager.loadAllBackupPayloads();
    expect(allBackups.length).toBe(0);
  });

  it('should save and load dark theme preference', async () => {
    expect(await preferencesManager.loadDarkThemePref()).toBeNull();

    await preferencesManager.saveDarkThemePref(true);
    expect(await preferencesManager.loadDarkThemePref()).toBe(true);

    await preferencesManager.saveDarkThemePref(false);
    expect(await preferencesManager.loadDarkThemePref()).toBe(false);
  });

  it('should save and load compact dashboard mode preference', async () => {
    expect(await preferencesManager.loadCompactDashboardModePref()).toBe(false);

    await preferencesManager.saveCompactDashboardModePref(true);
    expect(await preferencesManager.loadCompactDashboardModePref()).toBe(true);
  });

  it('should save and load telemetry rate preference', async () => {
    expect(await preferencesManager.loadTelemetryRatePref()).toBe(1);

    await preferencesManager.saveTelemetryRatePref(5);
    expect(await preferencesManager.loadTelemetryRatePref()).toBe(5);
  });

  it('should save and load options sub-tab preference', async () => {
    expect(await preferencesManager.loadOptionsSubTabPref()).toBe('display');

    await preferencesManager.saveOptionsSubTabPref('behavior');
    expect(await preferencesManager.loadOptionsSubTabPref()).toBe('behavior');
  });

  it('should default auto-connect to false and persist changes', async () => {
    expect(await preferencesManager.loadAutoConnectPref()).toBe(false);

    await preferencesManager.saveAutoConnectPref(true);
    expect(await preferencesManager.loadAutoConnectPref()).toBe(true);

    await preferencesManager.saveAutoConnectPref(false);
    expect(await preferencesManager.loadAutoConnectPref()).toBe(false);
  });

  it('should default auto-reconnect to false and persist changes', async () => {
    expect(await preferencesManager.loadAutoReconnectPref()).toBe(false);

    await preferencesManager.saveAutoReconnectPref(true);
    expect(await preferencesManager.loadAutoReconnectPref()).toBe(true);

    await preferencesManager.saveAutoReconnectPref(false);
    expect(await preferencesManager.loadAutoReconnectPref()).toBe(false);
  });
});

