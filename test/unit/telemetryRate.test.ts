import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('Telemetry Rate & Navigation Order Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should default telemetryRate to 1 second', () => {
    const store = useCarFixStore();
    expect(store.telemetryRate).toBe(1);
  });

  it('should update telemetryRate when setTelemetryRate is called', () => {
    const store = useCarFixStore();
    store.setTelemetryRate(0);
    expect(store.telemetryRate).toBe(0);

    store.setTelemetryRate(5);
    expect(store.telemetryRate).toBe(5);

    store.setTelemetryRate(60);
    expect(store.telemetryRate).toBe(60);
  });

  it('should cycle tabs in swapped order: connect -> pids -> modules -> options', () => {
    const store = useCarFixStore();
    expect(store.activeTab).toBe('connect');

    store.nextTab();
    expect(store.activeTab).toBe('pids');

    store.nextTab();
    expect(store.activeTab).toBe('modules');

    store.nextTab();
    expect(store.activeTab).toBe('options');

    store.prevTab();
    expect(store.activeTab).toBe('modules');

    store.prevTab();
    expect(store.activeTab).toBe('pids');

    store.prevTab();
    expect(store.activeTab).toBe('connect');
  });
});
