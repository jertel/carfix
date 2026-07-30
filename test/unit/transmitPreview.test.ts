import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { udsClient } from '../../src/core/obd/udsClient';
import { fordF150Gen14Module } from '../../src/modules/ford-f150-gen14';

describe('Module Write Transmission Preview (Troubleshooting Mode)', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    udsClient.isWriteDisabled = true;
  });

  it('should capture transmission preview payload and set showTransmitPreview flag during writeOption', async () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.vin = '1FTFW1ED4MFC12345';
    store.activeModuleId = 'ford-f150-gen14';

    const option = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_double_horn_honk')!;
    const result = await fordF150Gen14Module.writeOption(option, true);

    expect(result.success).toBe(true);
    expect(store.showTransmitPreview).toBe(true);
    expect(store.lastSimulatedTransmit).not.toBeNull();
    expect(store.lastSimulatedTransmit?.module).toBe('726');
    expect(store.lastSimulatedTransmit?.address).toBe('726-63-02');
    expect(store.lastSimulatedTransmit?.rawCommand).toContain('2E');
    expect(store.lastSimulatedTransmit?.udsService).toContain('0x2E');
  });

  it('should capture transmission preview payload during restoreOptionLine', async () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.vin = '1FTFW1ED4MFC12345';
    store.activeModuleId = 'ford-f150-gen14';

    const option = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_double_horn_honk')!;
    const restored = await store.restoreOptionLine(option, '0401 0100 0098');

    expect(restored).toBe(true);
    expect(store.showTransmitPreview).toBe(true);
    expect(store.lastSimulatedTransmit?.address).toBe('726-63-02');
    expect(store.lastSimulatedTransmit?.newHex).toBe('0401 0100 0098');
  });
});
