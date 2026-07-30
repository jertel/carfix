import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { readModuleAsBuiltLinesDynamic } from '../../src/modules/ford-f150-gen14/asBuiltRanges';
import { fordF150Gen14Module } from '../../src/modules/ford-f150-gen14/index';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('Dynamic As-Built Line Reading & UI Backup Progress', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should dynamically read module lines and invoke onProgress callback for each line', async () => {
    const recordedAddresses: string[] = [];

    const lines = await readModuleAsBuiltLinesDynamic('706', (addr) => {
      recordedAddresses.push(addr);
    });

    expect(Object.keys(lines).length).toBeGreaterThan(0);
    expect(recordedAddresses.length).toEqual(Object.keys(lines).length);
    expect(recordedAddresses).toContain('706-01-01');
    expect(recordedAddresses).toContain('706-05-02');
  });

  it('should pass onProgress callback through fordF150Gen14Module.readModuleData', async () => {
    const progressList: string[] = [];

    const data = await fordF150Gen14Module.readModuleData('724', (addr) => {
      progressList.push(addr);
    });

    expect(Object.keys(data).length).toBeGreaterThan(0);
    expect(progressList.length).toBeGreaterThan(0);
    expect(progressList).toContain('724-01-01');
  });

  it('should update carfixStore backup progress state during backupModule execution', async () => {
    const store = useCarFixStore();

    expect(store.isBackingUp).toBe(false);
    expect(store.backupLineCount).toBe(0);

    const backupPromise = store.backupModule('724');
    expect(store.isBackingUp).toBe(true);

    const success = await backupPromise;

    expect(success).toBe(true);
    expect(store.isBackingUp).toBe(false);
    expect(store.backupLineCount).toBeGreaterThan(0);
    expect(store.currentBackupLineAddress).toBeDefined();
    expect(store.backups.length).toBeGreaterThan(0);
  });

  it('should use Ford DE-prefix DID format (e.g. DE00 for 01-01) for dynamic UDS reading', async () => {
    const lines = await readModuleAsBuiltLinesDynamic('706');
    expect(lines['706-01-01']).toBeDefined();
    expect(lines['706-01-02']).toBeDefined();
  });

  it('should resolve module acronym APIM to 7D0 and create backup with canonical 7D0 ID', async () => {
    const store = useCarFixStore();
    const success = await store.backupModule('APIM');
    expect(success).toBe(true);

    const latestBackup = store.backups[0];
    expect(latestBackup.moduleId).toBe('7D0');
    expect(latestBackup.id).toContain('backup_7D0_');
    expect(Object.keys(latestBackup.asBuiltLines).some(k => k.startsWith('7D0-'))).toBe(true);
  });

  it('should probe UDS DIDs dynamically without hardcoded block ranges', async () => {
    const lines = await readModuleAsBuiltLinesDynamic('7D0');
    expect(lines['7D0-01-01']).toBeDefined();
    expect(lines['7D0-DE00']).toBeDefined();
    expect(lines['DE00']).toBeDefined();
  });
});
