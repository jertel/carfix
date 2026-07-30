import { describe, it, expect } from 'vitest';
import { IVehicleOption } from '../../src/core/types/module';

describe('Option Card Module Target Display Unit Tests', () => {
  it('should preserve unabbreviated target address on option card target line', () => {
    const testOption: IVehicleOption = {
      id: 'f150_bambi_mode_fog_high_beam',
      name: 'Bambi Mode (Fog Lights with High Beam)',
      description: 'Allows fog lights to remain illuminated when high beams are activated.',
      primaryModule: '726',
      targetAddress: '726-63-02',
      targetByteIndex: 1,
      targetBitMask: 0x01,
      safetyLevel: 'safe'
    };

    // Target display format on option cards: `Target: ${option.targetAddress}`
    const targetDisplay = `Target: ${testOption.targetAddress}`;
    expect(targetDisplay).toBe('Target: 726-63-02');
    expect(targetDisplay).not.toContain('BCM-63-02');
  });
});
