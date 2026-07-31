import { describe, it, expect } from 'vitest';
import { isOptionEnabled } from '../../src/core/utils/optionEvaluator';
import { IVehicleOption } from '../../src/core/types/module';

describe('Option Evaluator Utility', () => {
  const dummyOption: IVehicleOption = {
    id: 'f150_double_horn_honk',
    name: 'Double Horn Honk Removal',
    description: 'Prevents double horn honk',
    nameKey: 'options.doubleHornHonk.name',
    descriptionKey: 'options.doubleHornHonk.desc',
    category: 'CONVENIENCE',
    primaryModule: '726',
    targetAddress: '726-63-02',
    mask: 'xxx0 xxxx xx--',
    bitValues: [{ 0: 0 }],
    safetyLevel: 'LOW'
  };

  const multiBitOption: IVehicleOption = {
    id: 'f150_bluecruise_lane_biasing_predictive_speed',
    name: 'APIM Lane Biasing & Predictive Speed Assist',
    description: 'Enables Lane Biasing and Predictive Speed Assist',
    nameKey: 'options.laneBiasing.name',
    descriptionKey: 'options.laneBiasing.desc',
    category: 'DRIVER_ASSIST',
    primaryModule: '7D0',
    targetAddress: '7D0-09-05',
    mask: 'xxxx xx4x 2x--',
    bitValues: [{ 2: 1 }, { 1: 1 }],
    safetyLevel: 'HIGH'
  };

  it('should return true when hex matches mask character at specified nibble index', () => {
    expect(isOptionEnabled(dummyOption, '0400 0100 0098')).toBe(true);
  });

  it('should return false when hex does not match mask character at specified nibble index', () => {
    expect(isOptionEnabled(dummyOption, '0401 0100 0098')).toBe(false);
  });

  it('should evaluate multi-bit values correctly even when other bits in nibble are set', () => {
    // Mask xxxx xx4x 2x-- (bit 2 = 1 for nibble 6, bit 1 = 1 for nibble 8)
    // Hex 0000 0050 0368: nibble 6 = 5 (0101, bit 2 is 1), nibble 8 = 3 (0011, bit 1 is 1)
    expect(isOptionEnabled(multiBitOption, '0000 0050 0368')).toBe(true);

    // Hex 0000 0010 0168: nibble 6 = 1 (0001, bit 2 is 0), nibble 8 = 1 (0001, bit 1 is 0)
    expect(isOptionEnabled(multiBitOption, '0000 0010 0168')).toBe(false);
  });

  it('should return false when hex line is undefined or empty', () => {
    expect(isOptionEnabled(dummyOption, undefined)).toBe(false);
    expect(isOptionEnabled(dummyOption, '')).toBe(false);
  });

  it('should evaluate climate bar non-hybrid (hex 2) and hybrid (hex 6) masks', () => {
    const nonHybridOpt: IVehicleOption = {
      id: 'f150_climate_bar_non_hybrid',
      name: 'Climate Bar Non-Hybrid',
      description: 'Climate bar non-hybrid',
      nameKey: 'options.f150.climateBarNonHybrid.name',
      descriptionKey: 'options.f150.climateBarNonHybrid.description',
      category: 'CONVENIENCE',
      primaryModule: '7D0',
      targetAddress: '7D0-02-02',
      mask: 'xxx2 xxxx xx--',
      safetyLevel: 'LOW'
    };

    const hybridOpt: IVehicleOption = {
      id: 'f150_climate_bar_hybrid',
      name: 'Climate Bar Hybrid',
      description: 'Climate bar hybrid',
      nameKey: 'options.f150.climateBarHybrid.name',
      descriptionKey: 'options.f150.climateBarHybrid.description',
      category: 'CONVENIENCE',
      primaryModule: '7D0',
      targetAddress: '7D0-02-02',
      mask: 'xxx6 xxxx xx--',
      safetyLevel: 'LOW'
    };

    expect(isOptionEnabled(nonHybridOpt, '0002 0000 0000')).toBe(true);
    expect(isOptionEnabled(nonHybridOpt, '0006 0000 0000')).toBe(false);

    expect(isOptionEnabled(hybridOpt, '0006 0000 0000')).toBe(true);
    expect(isOptionEnabled(hybridOpt, '0002 0000 0000')).toBe(false);
  });
});
