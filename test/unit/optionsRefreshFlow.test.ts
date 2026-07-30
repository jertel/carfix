import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { IVehicleOption } from '../../src/core/types/module';

describe('Single Option On-Demand Refresh Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const testOption: IVehicleOption = {
    id: 'f150_double_horn_honk',
    name: 'Double Horn Honk Removal',
    description: 'Prevents double horn honk',
    category: 'CONVENIENCE',
    primaryModule: '726',
    targetAddress: '726-63-02',
    safetyLevel: 'LOW'
  };

  it('should initialize showExtDiagPrompt and hasConfirmedExtDiag as false', () => {
    const store = useCarFixStore();
    expect(store.showExtDiagPrompt).toBe(false);
    expect(store.hasConfirmedExtDiag).toBe(false);
    expect(store.pendingOptionToRead).toBeNull();
  });

  it('should open prompt and set pendingOptionToRead when targeted refresh requested', () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.connectedVin = '1FTFW1ED4MF123456';
    store.isVinMatched = true;

    store.requestOptionsRefresh(testOption);
    expect(store.showExtDiagPrompt).toBe(true);
    expect(store.pendingOptionToRead).toBe(testOption);
  });

  it('should clear pendingOptionToRead if user cancels prompt', () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.connectedVin = '1FTFW1ED4MF123456';
    store.isVinMatched = true;

    store.requestOptionsRefresh(testOption);
    store.cancelOptionsRefresh();

    expect(store.showExtDiagPrompt).toBe(false);
    expect(store.pendingOptionToRead).toBeNull();
    expect(store.hasConfirmedExtDiag).toBe(false);
  });

  it('should determine option toggle disable state based on connection and VIN match state', () => {
    const isOptionDisabled = (storeState: { isWriting: boolean; isConnected: boolean; isVinMatched: boolean; isEngineRunning: boolean }) => {
      return storeState.isWriting || !storeState.isConnected || !storeState.isVinMatched || storeState.isEngineRunning;
    };

    expect(isOptionDisabled({ isWriting: false, isConnected: true, isVinMatched: true, isEngineRunning: false })).toBe(false);
    expect(isOptionDisabled({ isWriting: false, isConnected: true, isVinMatched: false, isEngineRunning: false })).toBe(true);
    expect(isOptionDisabled({ isWriting: false, isConnected: true, isVinMatched: true, isEngineRunning: true })).toBe(true);
  });
});
