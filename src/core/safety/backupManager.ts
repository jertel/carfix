import { ILineHistoryEntry, ILineHistoryMap, IBlockLine } from '../types/module';
import { preferencesManager } from '../storage/preferencesManager';

/**
 * CarFix Line Backup & History Manager
 * Manages pre-modification line snapshots, line hex histories, and persistence via Capacitor preferences.
 */
export class BackupManager {
  private lineHistoryMap: ILineHistoryMap = {};

  /**
   * Records a line hex value snapshot before modification.
   * Prevents consecutive duplicate hex entries for the same line.
   */
  public recordLineBackup(targetAddress: string, hexValue: string, blockLines?: IBlockLine[]): ILineHistoryEntry {
    const timestampISO = new Date().toISOString();
    const cleanAddress = targetAddress.trim().toUpperCase();
    const entry: ILineHistoryEntry = {
      timestampISO,
      hexValue: hexValue.trim(),
      blockLines: blockLines && blockLines.length > 0 ? blockLines : undefined
    };

    if (!this.lineHistoryMap[cleanAddress]) {
      this.lineHistoryMap[cleanAddress] = [];
    }

    const history = this.lineHistoryMap[cleanAddress];
    const latest = history[0];
    if (!latest || latest.hexValue !== entry.hexValue) {
      history.unshift(entry);
      if (history.length > 50) {
        history.pop();
      }
      preferencesManager.saveLineHistory(this.lineHistoryMap).catch(() => {});
    }

    return entry;
  }

  /**
   * Returns history entries for a given target line address (newest first).
   */
  public getLineHistory(targetAddress: string): ILineHistoryEntry[] {
    const cleanAddress = targetAddress.trim().toUpperCase();
    return this.lineHistoryMap[cleanAddress] || [];
  }

  /**
   * Returns all line history records.
   */
  public getAllLineHistories(): ILineHistoryMap {
    return { ...this.lineHistoryMap };
  }

  /**
   * Loads persisted line history from Capacitor preferences on startup.
   */
  public async loadPersistedLineHistory(): Promise<ILineHistoryMap> {
    const loaded = await preferencesManager.loadLineHistory();
    this.lineHistoryMap = loaded || {};
    return this.lineHistoryMap;
  }

  /**
   * Clears line history for a specific address or all addresses.
   */
  public async clearLineHistory(targetAddress?: string): Promise<void> {
    if (targetAddress) {
      const cleanAddress = targetAddress.trim().toUpperCase();
      delete this.lineHistoryMap[cleanAddress];
    } else {
      this.lineHistoryMap = {};
    }
    await preferencesManager.saveLineHistory(this.lineHistoryMap);
  }
}

export const backupManager = new BackupManager();
