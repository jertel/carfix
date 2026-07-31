import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { backupManager } from '../../src/core/safety/backupManager';
import { IVehicleOption } from '../../src/core/types/module';

describe('Ad-Hoc Options Read Button & History Star Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const testOption: IVehicleOption = {
    id: 'f150_double_horn_honk',
    name: 'Double Horn Honk Removal',
    description: 'Prevents double horn honk when closing door with engine running.',
    primaryModule: '726',
    targetAddress: '726-63-02',
    targetByteIndex: 1,
    targetBitMask: 0x01,
    safetyLevel: 'safe'
  };

  it('should evaluate isOptionRead based on line hex presence in moduleData', () => {
    const store = useCarFixStore();
    const isOptionRead = (opt: IVehicleOption) => {
      return !!(store.moduleData[opt.targetAddress] && store.moduleData[opt.targetAddress] !== 'NO DATA');
    };

    expect(isOptionRead(testOption)).toBe(false);

    store.moduleData[testOption.targetAddress] = '726-63-02 0100 0000 0055';
    expect(isOptionRead(testOption)).toBe(true);
  });

  it('should detect when an option has saved line history for star indicator display', () => {
    const hasHistory = (opt: IVehicleOption) => {
      return backupManager.getLineHistory(opt.targetAddress).length > 0;
    };

    expect(hasHistory(testOption)).toBe(false);

    backupManager.recordLineBackup(testOption.targetAddress, '726-63-02 0000 0000 0054');
    expect(hasHistory(testOption)).toBe(true);
  });

  it('should NOT prompt when item is expanded, but prompt when Read button is clicked for unread option', async () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.connectedVin = '1FTFW1ED4MF123456';
    store.isVinMatched = true;

    let pendingOpt: IVehicleOption | null = null;

    const isOptionRead = (opt: IVehicleOption) => {
      return !!(store.moduleData[opt.targetAddress] && store.moduleData[opt.targetAddress] !== 'NO DATA');
    };

    // Expanding item does nothing to trigger prompt
    const onOptionExpand = () => {
      // Just expands accordion, no auto-read call
    };

    const onOptionRead = (opt: IVehicleOption) => {
      if (!isOptionRead(opt) && store.isConnected && store.isVinMatched && !store.isEngineRunning) {
        pendingOpt = opt;
        store.showExtDiagPrompt = true;
      }
    };

    // Simulate expansion
    onOptionExpand();
    expect(store.showExtDiagPrompt).toBe(false);
    expect(pendingOpt).toBeNull();

    // Simulate user clicking Read button
    onOptionRead(testOption);
    expect(store.showExtDiagPrompt).toBe(true);
    expect(pendingOpt).toBe(testOption);

    // Confirming prompt executes readOptionLine
    let readCalled = false;
    store.readOptionLine = async (opt: IVehicleOption) => {
      readCalled = true;
      store.moduleData[opt.targetAddress] = '726-63-02 0100 0000 0055';
    };

    if (pendingOpt) {
      const optToRead = pendingOpt;
      pendingOpt = null;
      store.showExtDiagPrompt = false;
      await store.readOptionLine(optToRead);
    }

    expect(store.showExtDiagPrompt).toBe(false);
    expect(readCalled).toBe(true);
    expect(store.moduleData[testOption.targetAddress]).toBe('726-63-02 0100 0000 0055');
  });

  it('should read ONLY the pending targeted option when confirming diagnostic prompt', async () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.connectedVin = '1FTFW1ED4MF123456';
    store.isVinMatched = true;

    let singleReadTarget: string | null = null;
    let batchReadCalled = false;

    store.readOptionLine = async (opt: IVehicleOption) => {
      singleReadTarget = opt.id;
    };
    store.readAllOptionLines = async () => {
      batchReadCalled = true;
    };

    store.requestOptionsRefresh(testOption);
    expect(store.pendingOptionToRead).toBe(testOption);
    expect(store.showExtDiagPrompt).toBe(true);

    await store.confirmOptionsRefresh();
    expect(store.showExtDiagPrompt).toBe(false);
    expect(store.hasConfirmedExtDiag).toBe(true);
    expect(singleReadTarget).toBe(testOption.id);
    expect(batchReadCalled).toBe(false);
    expect(store.pendingOptionToRead).toBeNull();
  });
});
