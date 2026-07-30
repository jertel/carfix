import { describe, it, expect, beforeEach } from 'vitest';
import { BackupManager } from '../../src/core/safety/backupManager';

describe('BackupManager Line Safety & History System', () => {
  let manager: BackupManager;

  beforeEach(() => {
    manager = new BackupManager();
  });

  it('should record line backup with ISO timestamp and hex value', () => {
    const entry = manager.recordLineBackup('726-63-02', '0401 0100 0098');

    expect(entry.hexValue).toBe('0401 0100 0098');
    expect(entry.timestampISO).toBeDefined();

    const history = manager.getLineHistory('726-63-02');
    expect(history.length).toBe(1);
    expect(history[0].hexValue).toBe('0401 0100 0098');
  });

  it('should prevent consecutive duplicate line hex records', () => {
    manager.recordLineBackup('726-63-02', '0401 0100 0098');
    manager.recordLineBackup('726-63-02', '0401 0100 0098');

    const history = manager.getLineHistory('726-63-02');
    expect(history.length).toBe(1);

    manager.recordLineBackup('726-63-02', '0401 0100 0099');
    expect(manager.getLineHistory('726-63-02').length).toBe(2);
  });

  it('should clear line history for specific target line or all lines', async () => {
    manager.recordLineBackup('726-63-01', '0102 0304 056F');
    manager.recordLineBackup('706-01-01', '0001 0203 040C');

    await manager.clearLineHistory('726-63-01');
    expect(manager.getLineHistory('726-63-01').length).toBe(0);
    expect(manager.getLineHistory('706-01-01').length).toBe(1);

    await manager.clearLineHistory();
    expect(manager.getLineHistory('706-01-01').length).toBe(0);
  });
});
