import { describe, it, expect } from 'vitest';
import { IVehicleModuleInfo } from '../../src/core/types/module';

function getLatestUpdateTimestamp(mod: IVehicleModuleInfo): number {
  if (mod.history && mod.history.length > 0) {
    const latestIso = mod.history[mod.history.length - 1].dateRecordedISO;
    const time = new Date(latestIso).getTime();
    if (!isNaN(time)) return time;
  }
  if (mod.firstDetectedISO) {
    const time = new Date(mod.firstDetectedISO).getTime();
    if (!isNaN(time)) return time;
  }
  return 0;
}

function findNewestModuleId(modules: IVehicleModuleInfo[]): string | null {
  if (!modules || modules.length === 0) return null;
  let maxTime = 0;
  let newestId: string | null = null;
  for (const mod of modules) {
    const t = getLatestUpdateTimestamp(mod);
    if (t > maxTime) {
      maxTime = t;
      newestId = mod.id;
    }
  }
  return maxTime > 0 ? newestId : null;
}

describe('Vehicle Modules Sorting & Newest Module Unit Tests', () => {
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

  it('should sort vehicle modules by date updated descending', () => {
    const rawModules: IVehicleModuleInfo[] = [
      {
        id: '760',
        name: 'Anti-Lock Brake System Module (ABS)',
        category: 'CHASSIS',
        currentVersion: 'v1',
        status: 'OK',
        firstDetectedISO: '2026-05-01T10:00:00.000Z'
      },
      {
        id: '726',
        name: 'Body Control Module (BCM)',
        category: 'BODY',
        currentVersion: 'v2',
        status: 'OK',
        history: [{ version: 'v2', dateRecordedISO: '2026-08-01T12:00:00.000Z' }]
      },
      {
        id: '7E7',
        name: 'Battery Energy Control Module (BECM)',
        category: 'POWERTRAIN',
        currentVersion: 'v1',
        status: 'OK',
        firstDetectedISO: '2026-07-01T10:00:00.000Z'
      }
    ];

    const sorted = [...rawModules].sort((a, b) => {
      const timeA = getLatestUpdateTimestamp(a);
      const timeB = getLatestUpdateTimestamp(b);
      if (timeB !== timeA) {
        return timeB - timeA;
      }
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    expect(sorted[0].id).toBe('726'); // August 2026
    expect(sorted[1].id).toBe('7E7'); // July 2026
    expect(sorted[2].id).toBe('760'); // May 2026
  });

  it('should correctly identify the single most recently updated module', () => {
    const rawModules: IVehicleModuleInfo[] = [
      {
        id: '760',
        name: 'ABS',
        category: 'CHASSIS',
        currentVersion: 'v1',
        status: 'OK',
        firstDetectedISO: '2026-05-01T10:00:00.000Z'
      },
      {
        id: '706',
        name: 'IPMA',
        category: 'SAFETY',
        currentVersion: 'v3',
        status: 'OK',
        history: [
          { version: 'v1', dateRecordedISO: '2026-01-01T00:00:00.000Z' },
          { version: 'v3', dateRecordedISO: '2026-08-01T15:30:00.000Z' }
        ]
      },
      {
        id: '726',
        name: 'BCM',
        category: 'BODY',
        currentVersion: 'v2',
        status: 'OK',
        firstDetectedISO: '2026-07-15T12:00:00.000Z'
      }
    ];

    const newestId = findNewestModuleId(rawModules);
    expect(newestId).toBe('706'); // IPMA updated on Aug 1, 2026 15:30
  });
});
