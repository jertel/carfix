import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';
import { PidViewMode } from '../pid/pidTypes';
import { ILineHistoryMap } from '../types/module';

export interface IPidPreferenceItem {
  id: string;
  viewMode: PidViewMode;
}

/**
 * Storage Preference Manager: Uses Capacitor Preferences on iOS/Android native platforms,
 * and falls back to Web localStorage on browser runtimes to avoid Capacitor web exceptions.
 */
export class PreferencesManager {
  static KEY_DASHBOARD_PREFERENCES = 'carfix_dashboard_preferences';
  static KEY_LAST_DEVICE = 'carfix_last_device';
  static KEY_DEBUG_LOGGING = 'carfix_debug_logging';
  static KEY_LINE_HISTORY = 'carfix_line_history';
  static KEY_DISCLAIMER_VERSIONS = 'carfix_disclaimer_agreed_versions';
  static KEY_DARK_THEME = 'carfix_dark_theme';
  static KEY_COMPACT_GRID = 'carfix_compact_grid';
  static KEY_TELEMETRY_RATE = 'carfix_telemetry_rate';
  static KEY_OPTIONS_SUB_TAB = 'carfix_options_sub_tab';
  static KEY_AUTO_CONNECT = 'carfix_auto_connect';
  static KEY_AUTO_RECONNECT = 'carfix_auto_reconnect';


  public static async saveDashboardPreferences(items: IPidPreferenceItem[]): Promise<void> {
    const jsonVal = JSON.stringify(items);
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({
          key: PreferencesManager.KEY_DASHBOARD_PREFERENCES,
          value: jsonVal
        });
        return;
      } catch (e) {
        // Fallback to web localStorage if native call fails
      }
    }
    localStorage.setItem(PreferencesManager.KEY_DASHBOARD_PREFERENCES, jsonVal);
  }

  public static async loadDashboardPreferences(): Promise<IPidPreferenceItem[]> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Preferences.get({ key: PreferencesManager.KEY_DASHBOARD_PREFERENCES });
        if (result.value) {
          return JSON.parse(result.value);
        }
      } catch (e) {
        // Fallback to web localStorage if native call fails
      }
    }

    const raw = localStorage.getItem(PreferencesManager.KEY_DASHBOARD_PREFERENCES);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {
        // Fallback
      }
    }
    return [];
  }

  public static async saveLastDeviceAddress(address: string): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({
          key: PreferencesManager.KEY_LAST_DEVICE,
          value: address
        });
        return;
      } catch (e) {
        // Fallback to web localStorage if native call fails
      }
    }
    localStorage.setItem(PreferencesManager.KEY_LAST_DEVICE, address);
  }

  public static async loadLastDeviceAddress(): Promise<string> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Preferences.get({ key: PreferencesManager.KEY_LAST_DEVICE });
        if (result.value) {
          return result.value;
        }
      } catch (e) {
        // Fallback to web localStorage if native call fails
      }
    }

    return localStorage.getItem(PreferencesManager.KEY_LAST_DEVICE) || '';
  }

  public static async saveDebugLoggingPref(enabled: boolean): Promise<void> {
    const strVal = enabled ? 'true' : 'false';
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_DEBUG_LOGGING, value: strVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_DEBUG_LOGGING, strVal);
  }

  public static async loadDebugLoggingPref(): Promise<boolean> {
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_DEBUG_LOGGING });
        if (res.value) {
          return res.value === 'true';
        }
      } catch (e) {}
    }
    return localStorage.getItem(PreferencesManager.KEY_DEBUG_LOGGING) === 'true';
  }

  public static async saveLineHistory(historyMap: ILineHistoryMap): Promise<void> {
    const jsonVal = JSON.stringify(historyMap);
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_LINE_HISTORY, value: jsonVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_LINE_HISTORY, jsonVal);
  }

  public static async loadLineHistory(): Promise<ILineHistoryMap> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Preferences.get({ key: PreferencesManager.KEY_LINE_HISTORY });
        if (result.value) {
          return JSON.parse(result.value);
        }
      } catch (e) {}
    }
    const raw = localStorage.getItem(PreferencesManager.KEY_LINE_HISTORY);
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch (e) {}
    }
    return {};
  }

  public static async loadAgreedDisclaimerVersions(): Promise<string[]> {
    if (Capacitor.isNativePlatform()) {
      try {
        const result = await Preferences.get({ key: PreferencesManager.KEY_DISCLAIMER_VERSIONS });
        if (result.value) {
          return JSON.parse(result.value);
        }
      } catch (e) {}
    }
    const raw = localStorage.getItem(PreferencesManager.KEY_DISCLAIMER_VERSIONS);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {}
    }
    return [];
  }

  public static async saveAgreedDisclaimerVersion(version: string): Promise<void> {
    if (!version) return;
    const versions = await PreferencesManager.loadAgreedDisclaimerVersions();
    if (!versions.includes(version)) {
      versions.push(version);
    }
    const jsonVal = JSON.stringify(versions);
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_DISCLAIMER_VERSIONS, value: jsonVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_DISCLAIMER_VERSIONS, jsonVal);
  }

  public static async isDisclaimerAgreedForVersion(version: string): Promise<boolean> {
    const versions = await PreferencesManager.loadAgreedDisclaimerVersions();
    return versions.includes(version);
  }

  public static async saveDarkThemePref(enabled: boolean): Promise<void> {
    const strVal = enabled ? 'true' : 'false';
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_DARK_THEME, value: strVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_DARK_THEME, strVal);
  }

  public static async loadDarkThemePref(): Promise<boolean | null> {
    let raw: string | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_DARK_THEME });
        raw = res.value;
      } catch (e) {}
    }
    if (raw === null || raw === undefined) {
      raw = localStorage.getItem(PreferencesManager.KEY_DARK_THEME);
    }
    if (raw === null || raw === undefined) {
      return null;
    }
    return raw === 'true';
  }

  public static async saveCompactDashboardModePref(enabled: boolean): Promise<void> {
    const strVal = enabled ? 'true' : 'false';
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_COMPACT_GRID, value: strVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_COMPACT_GRID, strVal);
  }

  public static async loadCompactDashboardModePref(): Promise<boolean> {
    let raw: string | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_COMPACT_GRID });
        raw = res.value;
      } catch (e) {}
    }
    if (raw === null || raw === undefined) {
      raw = localStorage.getItem(PreferencesManager.KEY_COMPACT_GRID);
    }
    return raw === 'true';
  }

  public static async saveTelemetryRatePref(rate: number): Promise<void> {
    const strVal = String(rate);
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_TELEMETRY_RATE, value: strVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_TELEMETRY_RATE, strVal);
  }

  public static async loadTelemetryRatePref(): Promise<number> {
    let raw: string | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_TELEMETRY_RATE });
        raw = res.value;
      } catch (e) {}
    }
    if (raw === null || raw === undefined) {
      raw = localStorage.getItem(PreferencesManager.KEY_TELEMETRY_RATE);
    }
    if (raw !== null && raw !== undefined) {
      const parsed = parseInt(raw, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    return 1;
  }

  public static async saveOptionsSubTabPref(tab: 'display' | 'behavior'): Promise<void> {
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_OPTIONS_SUB_TAB, value: tab });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_OPTIONS_SUB_TAB, tab);
  }

  public static async loadOptionsSubTabPref(): Promise<'display' | 'behavior'> {
    let raw: string | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_OPTIONS_SUB_TAB });
        raw = res.value;
      } catch (e) {}
    }
    if (raw === null || raw === undefined) {
      raw = localStorage.getItem(PreferencesManager.KEY_OPTIONS_SUB_TAB);
    }
    if (raw === 'display' || raw === 'behavior') {
      return raw;
    }
    return 'display';
  }

  public static async saveAutoConnectPref(enabled: boolean): Promise<void> {
    const strVal = enabled ? 'true' : 'false';
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_AUTO_CONNECT, value: strVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_AUTO_CONNECT, strVal);
  }

  public static async loadAutoConnectPref(): Promise<boolean> {
    let raw: string | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_AUTO_CONNECT });
        raw = res.value;
      } catch (e) {}
    }
    if (raw === null || raw === undefined) {
      raw = localStorage.getItem(PreferencesManager.KEY_AUTO_CONNECT);
    }
    return raw === 'true';
  }

  public static async saveAutoReconnectPref(enabled: boolean): Promise<void> {
    const strVal = enabled ? 'true' : 'false';
    if (Capacitor.isNativePlatform()) {
      try {
        await Preferences.set({ key: PreferencesManager.KEY_AUTO_RECONNECT, value: strVal });
        return;
      } catch (e) {}
    }
    localStorage.setItem(PreferencesManager.KEY_AUTO_RECONNECT, strVal);
  }

  public static async loadAutoReconnectPref(): Promise<boolean> {
    let raw: string | null = null;
    if (Capacitor.isNativePlatform()) {
      try {
        const res = await Preferences.get({ key: PreferencesManager.KEY_AUTO_RECONNECT });
        raw = res.value;
      } catch (e) {}
    }
    if (raw === null || raw === undefined) {
      raw = localStorage.getItem(PreferencesManager.KEY_AUTO_RECONNECT);
    }
    return raw === 'true';
  }
}

export const preferencesManager = PreferencesManager;
