import { describe, it, expect, beforeEach } from 'vitest';
import { fordF150Gen14Module } from '../../src/modules/ford-f150-gen14/index';
import { moduleRegistry } from '../../src/core/registry/moduleRegistry';

describe('Automatic VIN Vehicle Module Matcher', () => {
  beforeEach(() => {
    moduleRegistry.clear();
    moduleRegistry.registerModule(fordF150Gen14Module);
  });

  it('should match Ford F-150 VIN prefix 1FTFW1ED4MF123456 to Ford module', () => {
    const vin = '1FTFW1ED4MF123456';
    expect(fordF150Gen14Module.matchesVin(vin)).toBe(true);

    const matched = moduleRegistry.findModuleForVin(vin);
    expect(matched).toBeDefined();
    expect(matched?.id).toBe('ford-f150-gen14');
  });

  it('should match Ford F-150 Lightning EV and regional Ford WMIs (1FTVW, 2FT, 3FT)', () => {
    const lightningVin = '1FTVW1EL5NW123456';
    expect(fordF150Gen14Module.matchesVin(lightningVin)).toBe(true);
    expect(moduleRegistry.findModuleForVin(lightningVin)?.id).toBe('ford-f150-gen14');

    const canadaVin = '2FTEX1EV3MF123456';
    expect(fordF150Gen14Module.matchesVin(canadaVin)).toBe(true);

    const mexicoVin = '3FTTW1ED7MF123456';
    expect(fordF150Gen14Module.matchesVin(mexicoVin)).toBe(true);
  });

  it('should reject Mazda or non-Ford VIN prefix (e.g. JM1)', () => {
    const mazdaVin = 'JM1BL1H54A1123456';
    expect(fordF150Gen14Module.matchesVin(mazdaVin)).toBe(false);

    const matched = moduleRegistry.findModuleForVin(mazdaVin);
    expect(matched).toBeUndefined();
  });
});
