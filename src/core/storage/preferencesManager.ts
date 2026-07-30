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
}

export const preferencesManager = PreferencesManager;
