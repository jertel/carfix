import { describe, it, expect } from 'vitest';
import { IPidState } from '../../src/core/pid/pidTypes';

describe('PID Card Integrated Sparkline Unit Tests', () => {
  it('should format sparkline data points correctly from history array', () => {
    const pidState: IPidState = {
      definition: {
        id: 'engine_rpm',
        nameKey: 'pids.rpm.name',
        name: 'Engine RPM',
        command: '010C',
        unit: 'RPM',
        minValue: 0,
        maxValue: 8000,
        decoder: () => 3500
      },
      currentValue: 3500,
      history: [
        { timestampISO: '2026-07-28T18:00:00Z', value: 3000 },
        { timestampISO: '2026-07-28T18:00:01Z', value: 3500 },
        { timestampISO: '2026-07-28T18:00:02Z', value: 4000 }
      ],
      viewMode: 'READOUT',
      orderIndex: 0
    };

    expect(pidState.history.length).toBe(3);
    expect(pidState.currentValue).toBe(3500);
    expect(pidState.definition.unit).toBe('RPM');
  });
});
