import { describe, it, expect } from 'vitest';
import { IVehicleOption } from '../../src/core/types/module';

describe('Vehicle Options Alphabetical Sorting Unit Tests', () => {
  it('should sort vehicle options alphabetically by display title', () => {
    const mockOptions: IVehicleOption[] = [
      { id: 'f150_turn_signal_tap_5', name: 'Set Turn Signal Tap Count to 5 Flashes', description: '', primaryModule: '724', targetAddress: '724-01-01', targetByteIndex: 0, targetBitMask: 0x01, safetyLevel: 'safe' },
      { id: 'f150_double_horn_honk', name: 'Double Horn Honk Removal', description: '', primaryModule: '726', targetAddress: '726-63-02', targetByteIndex: 1, targetBitMask: 0x01, safetyLevel: 'safe' },
      { id: 'f150_bambi_mode_fog_high_beam', name: 'Bambi Mode (Fog + High Beam) Enable', description: '', primaryModule: '726', targetAddress: '726-27-01', targetByteIndex: 0, targetBitMask: 0x01, safetyLevel: 'safe' }
    ];

    const sorted = [...mockOptions].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    expect(sorted.map(o => o.name)).toEqual([
      'Bambi Mode (Fog + High Beam) Enable',
      'Double Horn Honk Removal',
      'Set Turn Signal Tap Count to 5 Flashes'
    ]);
  });
});
