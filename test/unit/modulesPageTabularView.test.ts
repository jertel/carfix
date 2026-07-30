import { describe, it, expect } from 'vitest';
import { IVehicleModuleInfo } from '../../src/core/types/module';
import { getModuleAbbrevFromInfo } from '../../src/core/utils/hexUtils';
import { formatModuleExportFilename, formatFiveByteHexChunk } from '../../src/core/utils/moduleExporter';

describe('Modules Page Tabular View Data Unit Tests', () => {
  const sampleModules: IVehicleModuleInfo[] = [
    {
      id: '726',
      name: 'Body Control Module (BCM / BdyCM)',
      category: 'BODY',
      currentVersion: 'v1.0',
      partNumber: 'ML3T-14G647-AB',
      softwareVersion: 'ML3T-14G648-BA',
      status: 'OK'
    },
    {
      id: '706',
      name: 'Image Processing Module A (IPMA)',
      category: 'SAFETY',
      currentVersion: 'v2.1',
      partNumber: 'ML3T-19H406-AC',
      softwareVersion: 'ML3T-14G647-BC',
      status: 'OK'
    },
    {
      id: '7D0',
      name: 'Access Interface Module (APIM)',
      category: 'INFOTAINMENT',
      currentVersion: 'v3.0',
      status: 'UPDATE_AVAILABLE'
    }
  ];

  it('should extract module abbreviations correctly for tabular display', () => {
    expect(getModuleAbbrevFromInfo(sampleModules[0])).toBe('BCM');
    expect(getModuleAbbrevFromInfo(sampleModules[1])).toBe('IPMA');
    expect(getModuleAbbrevFromInfo(sampleModules[2])).toBe('APIM');
  });

  it('should format module CAN ID code for dedicated column', () => {
    const getModuleCodeColumnText = (mod: IVehicleModuleInfo) => `0x${mod.id}`;
    expect(getModuleCodeColumnText(sampleModules[0])).toBe('0x726');
    expect(getModuleCodeColumnText(sampleModules[1])).toBe('0x706');
    expect(getModuleCodeColumnText(sampleModules[2])).toBe('0x7D0');
  });

  it('should display software version or fallback part number on right side', () => {
    const getRightSideText = (mod: IVehicleModuleInfo) => {
      return mod.softwareVersion || mod.partNumber || mod.currentVersion || 'N/A';
    };

    expect(getRightSideText(sampleModules[0])).toBe('ML3T-14G648-BA');
    expect(getRightSideText(sampleModules[1])).toBe('ML3T-14G647-BC');
    expect(getRightSideText(sampleModules[2])).toBe('v3.0');
  });

  it('should manage expanded module details toggle state', () => {
    const expandedMap: Record<string, boolean> = {};

    const toggle = (id: string) => {
      expandedMap[id] = !expandedMap[id];
    };

    expect(expandedMap['726']).toBeFalsy();
    toggle('726');
    expect(expandedMap['726']).toBe(true);
    toggle('726');
    expect(expandedMap['726']).toBe(false);
  });

  it('should format export action filename and line text correctly', () => {
    const fixedDate = new Date(2026, 6, 29, 19, 45, 21);
    const filename = formatModuleExportFilename('726', fixedDate);
    expect(filename).toBe('module-export-726-20260729194521.txt');

    const formattedLine = formatFiveByteHexChunk([0x12, 0x34, 0x56, 0x78, 0x9A]);
    expect(formattedLine).toBe('1234-5678-9A');
  });
});
