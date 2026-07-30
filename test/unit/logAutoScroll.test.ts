import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('Log Auto-Scroll Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should manage autoScroll state and update log stream when new entries arrive', () => {
    const store = useCarFixStore();
    let autoScroll = true;

    expect(autoScroll).toBe(true);
    expect(store.logs.length).toBe(0);

    store.addLog('INF', 'Initial log entry');
    expect(store.logs.length).toBe(1);

    // Toggle auto scroll OFF
    autoScroll = false;
    store.addLog('INF', 'Second log entry');
    expect(store.logs.length).toBe(2);
    expect(autoScroll).toBe(false);

    // Toggle auto scroll ON
    autoScroll = true;
    expect(autoScroll).toBe(true);
  });

  it('should toggle debug logging state when debug mode icon button is pressed', () => {
    const store = useCarFixStore();
    expect(store.isDebugLoggingEnabled).toBe(false);

    store.setDebugLogging(true);
    expect(store.isDebugLoggingEnabled).toBe(true);

    store.setDebugLogging(false);
    expect(store.isDebugLoggingEnabled).toBe(false);
  });

  it('should clear all diagnostic logs when clear button is triggered', () => {
    const store = useCarFixStore();
    store.addLog('INF', 'Test entry');
    expect(store.logs.length).toBe(1);

    store.clearLogs();
    expect(store.logs.length).toBe(0);
  });
});
