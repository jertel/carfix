import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';

describe('PID Card Drag Insertion Reordering', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    localStorage.clear();
  });

  it('should insert dragged PID before drop target', async () => {
    const store = useCarFixStore();
    store.pids = [
      { definition: { id: 'pid1', name: 'PID 1', command: '01', minValue: 0, maxValue: 100, unit: '', decoder: () => 0 }, currentValue: 0, history: [], viewMode: 'READOUT', orderIndex: 0 },
      { definition: { id: 'pid2', name: 'PID 2', command: '02', minValue: 0, maxValue: 100, unit: '', decoder: () => 0 }, currentValue: 0, history: [], viewMode: 'READOUT', orderIndex: 1 },
      { definition: { id: 'pid3', name: 'PID 3', command: '03', minValue: 0, maxValue: 100, unit: '', decoder: () => 0 }, currentValue: 0, history: [], viewMode: 'READOUT', orderIndex: 2 }
    ];

    // Drag pid3 and insert BEFORE pid1
    await store.insertPidAtTarget('pid3', 'pid1', 'before');

    const orderedIds = store.sortedPids.map(p => p.definition.id);
    expect(orderedIds).toEqual(['pid3', 'pid1', 'pid2']);
  });

  it('should insert dragged PID after drop target', async () => {
    const store = useCarFixStore();
    store.pids = [
      { definition: { id: 'pid1', name: 'PID 1', command: '01', minValue: 0, maxValue: 100, unit: '', decoder: () => 0 }, currentValue: 0, history: [], viewMode: 'READOUT', orderIndex: 0 },
      { definition: { id: 'pid2', name: 'PID 2', command: '02', minValue: 0, maxValue: 100, unit: '', decoder: () => 0 }, currentValue: 0, history: [], viewMode: 'READOUT', orderIndex: 1 },
      { definition: { id: 'pid3', name: 'PID 3', command: '03', minValue: 0, maxValue: 100, unit: '', decoder: () => 0 }, currentValue: 0, history: [], viewMode: 'READOUT', orderIndex: 2 }
    ];

    // Drag pid1 and insert AFTER pid2
    await store.insertPidAtTarget('pid1', 'pid2', 'after');

    const orderedIds = store.sortedPids.map(p => p.definition.id);
    expect(orderedIds).toEqual(['pid2', 'pid1', 'pid3']);
  });
});
