import { describe, it, expect, beforeEach } from 'vitest';
import { fordF150Gen14Module } from '../../src/modules/ford-f150-gen14/index';

describe('ECU Module Software Version Scanner', () => {
  it('should scan Ford internal modules and return software calibration versions', async () => {
    const modules = await fordF150Gen14Module.scanModuleVersions();
    expect(modules.length).toBeGreaterThan(0);

    const bcm = modules.find(m => m.id === '726');
    expect(bcm).toBeDefined();
    expect(bcm?.name).toContain('Body Control Module');
    expect(bcm?.currentVersion).toContain('ML3T-14G000-AA');

    const ipma = modules.find(m => m.id === '706');
    expect(ipma).toBeDefined();
    expect(ipma?.currentVersion).toContain('ML3T-14G647-AB');
  });
});
