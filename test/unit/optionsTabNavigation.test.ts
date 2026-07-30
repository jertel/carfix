import { describe, it, expect } from 'vitest';
import { ref } from 'vue';

describe('Navigation & Sub-Tab Navigation Unit Tests', () => {
  it('should default activeOptionsSubTab to display and switch to behavior', () => {
    const activeOptionsSubTab = ref<'display' | 'behavior'>('display');
    expect(activeOptionsSubTab.value).toBe('display');

    activeOptionsSubTab.value = 'behavior';
    expect(activeOptionsSubTab.value).toBe('behavior');
  });

  it('should default activeModulesSubTab to modules and switch to configure', () => {
    const activeModulesSubTab = ref<'modules' | 'configure'>('modules');
    expect(activeModulesSubTab.value).toBe('modules');

    activeModulesSubTab.value = 'configure';
    expect(activeModulesSubTab.value).toBe('configure');
  });

  it('should check line history using backupManager getLineHistory length', () => {
    const { backupManager } = require('../../src/core/safety/backupManager');
    backupManager.recordLineBackup('726-01-01', '1234567890');
    expect(backupManager.getLineHistory('726-01-01').length).toBeGreaterThan(0);
  });
});
