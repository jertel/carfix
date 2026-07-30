import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('Disconnected Telemetry Display Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should reflect disconnected state when adapter is not connected', () => {
    const store = useCarFixStore();
    expect(store.isConnected).toBe(false);
  });

  it('should reset telemetry state upon adapter connection and disconnection', async () => {
    const store = useCarFixStore();
    store.selectedDeviceAddress = 'DEMO_MODE';
    await store.connectAdapter();
    expect(store.isConnected).toBe(true);

    await store.disconnectAdapter();
    expect(store.isConnected).toBe(false);
  });
});
