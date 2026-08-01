import { describe, it, expect } from 'vitest';
import { FordF150Gen14Module } from '../../src/modules/ford-f150-gen14';

describe('Ford ECU Module Scan Catalog Unit Tests', () => {
  it('should scan and return all 48 Ford vehicle ECU modules matching the official module list', async () => {
    const fordModule = new FordF150Gen14Module();
    const modules = await fordModule.scanModuleVersions();

    expect(modules.length).toBe(48);

    const expectedModuleList: Array<{ id: string; name: string }> = [
      { id: '760', name: 'Anti-Lock Brake System (ABS)' },
      { id: '7C7', name: 'Air Conditioning Control Module (ACCM)' },
      { id: '727', name: 'Audio Front Control Module (ACM)' },
      { id: '7D0', name: 'Accessory Protocol Interface Module (SYNC) (APIM)' },
      { id: '792', name: 'All Terrain Control Module (ATCM)' },
      { id: '726', name: 'Body Control Module (BCM)' },
      { id: '6F0', name: 'Body Control Module C [battery junction box] (BCMC [BJB])' },
      { id: '7E4', name: 'Battery Energy Control Module (BECM)' },
      { id: '764', name: 'Cruise Control Module (CCM)' },
      { id: '7C1', name: 'Camera Module Rear [Driver Status Monitor Camera Module] (CMR)' },
      { id: '6F1', name: 'Direct Current/Alternating Current Converter Module A (DCACA)' },
      { id: '746', name: 'Direct Current/Direct Current Converter Module (DCDC)' },
      { id: '740', name: 'Driver Door Module (being renamed to Intelligent Power Window Control Module) (DDM)' },
      { id: '744', name: 'Driver Front Seat Module / Running Board Control Module (DSM / RBM)' },
      { id: '783', name: 'Audio Digital Signal Processing Module (DSP)' },
      { id: '6E3', name: 'Front Hatch Control Module (FHCM)' },
      { id: '732', name: 'Gear Shift Module (GSM)' },
      { id: '716', name: 'Gateway Module A (GWM)' },
      { id: '734', name: 'Headlamp Control Module (HCM)' },
      { id: '733', name: 'Heating, Ventillation and Air Conditioning Module (HVAC)' },
      { id: '720', name: 'Instrument Panel Cluster (IPC)' },
      { id: '706', name: 'Image Processing Module A (IPMA)' },
      { id: '765', name: 'Occupant Classification System (OCS)' },
      { id: '750', name: 'Pedestrian Alert Control Module (PACM)' },
      { id: '7E0', name: 'Powertrain Control Module (gas) *Diesel PCM not OTA capable* (PCM)' },
      { id: '741', name: 'Passenger Door Module (is being renamed to Door Control Modulee B) (PDM)' },
      { id: '730', name: 'Power Steering Control Module (PSCM)' },
      { id: '737', name: 'Restraints Control Module (RCM)' },
      { id: '731', name: 'Remote Function Actuator (RFA)' },
      { id: '775', name: 'Rear Gate Trunk Module (RGTM)' },
      { id: '751', name: 'Radio Transceiver Module (RTM)' },
      { id: '797', name: 'Steering Angle Sensor Module (SASM)' },
      { id: '724', name: 'Steering Column Control Module (SCCM)' },
      { id: '712', name: 'Driver Multi-Contour Seat Module (SCMG)' },
      { id: '713', name: 'Passenger Multi-Contour Seat Module (SCMH)' },
      { id: '7C5', name: 'Steering Effort Control Module (SECM)' },
      { id: '7E6', name: 'Secondary On-Board Diagnostic Control Module C (SOBDMC)' },
      { id: '6F2', name: 'Side Obstacle Detection Control Module C (SODCMC)' },
      { id: '6F3', name: 'Side Obstacle Detection Control Module D (SODCMD)' },
      { id: '7C4', name: 'Side Obstacle Detection Control Module LH (SODL)' },
      { id: '7C6', name: 'Side Obstacle Detection Control Module RH (SODR)' },
      { id: '761', name: 'Transfer Case Control Module (TCCM)' },
      { id: '7E9', name: 'Transmission Control Module (TCM)' },
      { id: '754', name: 'Telematic Control Unit Module (TCU)' },
      { id: '791', name: 'Trailer Module / Trailer Brake Control Module (TRM / TBM)' },
      { id: '6D1', name: 'Upfitter Customization Interface Module (UCIM)' },
      { id: '721', name: 'Vehicle Dynamics Control Module (VDM)' },
      { id: '725', name: 'Wireless Accessory Charging Module (WACM)' }
    ];

    for (const expected of expectedModuleList) {
      const found = modules.find(m => m.id === expected.id);
      expect(found).toBeDefined();
      expect(found?.name).toBe(expected.name);
    }

    // Verify separate partNumber and softwareVersion fields
    const bcm = modules.find(m => m.id === '726');
    expect(bcm?.partNumber).toBe('ML3T-14G000-AA');
    expect(bcm?.softwareVersion).toBe('ML3T-14G001-AA');

    const apim = modules.find(m => m.id === '7D0');
    expect(apim?.partNumber).toBe('MU5T-14G371-FA');
    expect(apim?.softwareVersion).toBe('MU5T-14G374-BA');
  });
});
