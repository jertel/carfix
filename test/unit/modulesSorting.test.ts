import { describe, it, expect } from 'vitest';
import { IVehicleModuleInfo } from '../../src/core/types/module';

describe('Vehicle Modules Alphabetical Sorting Unit Tests', () => {
  it('should sort vehicle modules alphabetically by name', () => {
    const rawModules: IVehicleModuleInfo[] = [
      { id: '7E7', name: 'Battery Energy Control Module (BECM)', category: 'POWERTRAIN', currentVersion: 'v1', status: 'OK' },
      { id: '760', name: 'Anti-Lock Brake System Module (ABS)', category: 'CHASSIS', currentVersion: 'v1', status: 'OK' },
      { id: '726', name: 'Body Control Module (BCM / BdyCM)', category: 'BODY', currentVersion: 'v1', status: 'OK' }
    ];

    const sorted = [...rawModules].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

    expect(sorted[0].name).toBe('Anti-Lock Brake System Module (ABS)');
    expect(sorted[1].name).toBe('Battery Energy Control Module (BECM)');
    expect(sorted[2].name).toBe('Body Control Module (BCM / BdyCM)');
  });
});
