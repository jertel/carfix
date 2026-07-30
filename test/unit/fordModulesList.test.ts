import { describe, it, expect } from 'vitest';
import { FordF150Gen14Module } from '../../src/modules/ford-f150-gen14';

describe('Ford ECU Module Scan Catalog Unit Tests', () => {
  it('should scan and return all 26 core Ford vehicle ECU modules with separate part number and software version', async () => {
    const fordModule = new FordF150Gen14Module();
    const modules = await fordModule.scanModuleVersions();

    expect(modules.length).toBe(26);

    const ids = modules.map(m => m.id);
    expect(ids).toContain('7E0'); // PCM
    expect(ids).toContain('7E1'); // TCM
    expect(ids).toContain('7E2'); // SOBDM
    expect(ids).toContain('7E4'); // TMC
    expect(ids).toContain('7E7'); // BECM
    expect(ids).toContain('726'); // BCM
    expect(ids).toContain('7D0'); // APIM
    expect(ids).toContain('720'); // IPC
    expect(ids).toContain('706'); // IPMA
    expect(ids).toContain('760'); // ABS
    expect(ids).toContain('754'); // TCU

    // Verify separate partNumber and softwareVersion fields
    const bcm = modules.find(m => m.id === '726');
    expect(bcm?.partNumber).toBe('ML3T-14G000-AA');
    expect(bcm?.softwareVersion).toBe('ML3T-14G001-AA');

    const apim = modules.find(m => m.id === '7D0');
    expect(apim?.partNumber).toBe('MU5T-14G371-FA');
    expect(apim?.softwareVersion).toBe('MU5T-14G374-BA');
  });
});
