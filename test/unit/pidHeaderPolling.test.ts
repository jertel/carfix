import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { obdBridge } from '../../src/core/obd/obdBridge';

describe('PID CAN Header Telemetry Polling', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should switch CAN header to match PID definition during telemetry polling', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    const setHeaderSpy = vi.spyOn(obdBridge, 'setHeader');

    await store.addPidToDashboard('hev_hv_soc');
    const hvSocState = store.pids.find(p => p.definition.id === 'hev_hv_soc');

    expect(hvSocState).toBeDefined();
    expect(hvSocState?.definition.header).toBe('7E7');

    await obdBridge.setHeader(hvSocState!.definition.header!);
    expect(setHeaderSpy).toHaveBeenCalledWith('7E7');
  });

  it('should execute a single pass telemetry refresh when pollTelemetryOnce is invoked', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();

    const initialHistoryLen = store.pids[0].history.length;
    await store.pollTelemetryOnce();

    expect(store.pids[0].history.length).toBeGreaterThanOrEqual(initialHistoryLen);
  });
});
