import { describe, it, expect, vi } from 'vitest';
import { fordF150Gen14Module } from '../../src/modules/ford-f150-gen14/index';
import { obdBridge } from '../../src/core/obd/obdBridge';
import { udsClient } from '../../src/core/obd/udsClient';

describe('Ford F-150 Gen 14 Vehicle Module', () => {
  it('should list catalog options including all 6 Bluecruise 1.4 options', () => {
    const catalog = fordF150Gen14Module.optionsCatalog;
    expect(catalog.length).toBe(12);

    const ids = catalog.map(opt => opt.id);
    expect(ids).toContain('f150_double_horn_honk');
    expect(ids).toContain('f150_enable_lane_change_assist');
    expect(ids).toContain('f150_enable_in_lane_repositioning');
    expect(ids).toContain('f150_bluecruise_lane_biasing_predictive_speed');
    expect(ids).toContain('f150_bluecruise_apim_lane_change_assist');
    expect(ids).toContain('f150_ipma_module_feature_cfg_alb_alc');
    expect(ids).toContain('f150_ipma_customer_setting_alb_alc_selected');
    expect(ids).toContain('f150_bambi_mode_fog_high_beam');

    // Verify IPMA minVersion requirement is RJ6T-14H102-ACJ across all BlueCruise 1.4 options
    const bcOptions = catalog.filter(opt => opt.id.includes('lane') || opt.id.includes('ipma') || opt.id.includes('bluecruise'));
    expect(bcOptions.length).toBe(6);
    bcOptions.forEach(opt => {
      expect(opt.firmwareRequirements).toBeDefined();
      const ipmaReq = opt.firmwareRequirements!.find(req => req.moduleId === '706');
      expect(ipmaReq?.minVersion).toBe('RJ6T-14H102-ACJ');
    });
  });

  it('should supplement module-specific proprietary OEM PIDs', () => {
    const pidCatalog = fordF150Gen14Module.pidCatalog;
    expect(pidCatalog).toBeDefined();
    expect(pidCatalog!.length).toBeGreaterThanOrEqual(10);

    const pidIds = pidCatalog!.map(p => p.id);
    expect(pidIds).toContain('ford_12v_battery_soc');
    expect(pidIds).toContain('hev_cell_voltage_min');
    expect(pidIds).toContain('hev_cell_voltage_max');
    expect(pidIds).toContain('hev_cell_voltage_delta');
  });

  it('should verify Bambi mode uses corrected address 726-39-02', () => {
    const bambiOpt = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_bambi_mode_fog_high_beam')!;
    expect(bambiOpt.targetAddress).toBe('726-39-02');
  });

  it('should verify turn signal tap 5 uses address 724-01-01 and mask xxxxxAxxxx--', () => {
    const tapOpt = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_turn_signal_tap_5')!;
    expect(tapOpt.targetAddress).toBe('724-01-01');
    expect(tapOpt.mask).toBe('xxxxxAxxxx--');
  });

  it('should successfully modify and write option with checksum recalculation', async () => {
    const option = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_double_horn_honk')!;

    const result = await fordF150Gen14Module.writeOption(option, true);

    expect(result.success).toBe(true);
    expect(result.address).toBe('726-63-02');
    expect(result.verifiedHex).toBeDefined();
    expect(result.timestampISO).toBeDefined();
  });

  it('should successfully write multi-nibble Bluecruise 1.4 option 7D0-09-05', async () => {
    const option = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_bluecruise_lane_biasing_predictive_speed')!;

    const result = await fordF150Gen14Module.writeOption(option, true);

    expect(result.success).toBe(true);
    expect(result.address).toBe('7D0-09-05');
    expect(result.verifiedHex).toBe('0000 0040 2068');
  });

  it('should untoggle double horn honk using revertMask xxx1 xxxx xx--', async () => {
    const option = fordF150Gen14Module.optionsCatalog.find(opt => opt.id === 'f150_double_horn_honk')!;
    expect(option.revertMask).toBe('xxx1 xxxx xx--');

    const result = await fordF150Gen14Module.writeOption(option, false);

    expect(result.success).toBe(true);
    expect(result.address).toBe('726-63-02');
    expect(result.verifiedHex).toBe('0401 0100 0098');
  });

  it('should reject untoggling an option that lacks both revertMask and bitValues', async () => {
    const dummyOpt = {
      ...fordF150Gen14Module.optionsCatalog[0],
      revertMask: undefined,
      bitValues: undefined
    };

    const result = await fordF150Gen14Module.writeOption(dummyOpt, false);

    expect(result.success).toBe(false);
    expect(result.error).toContain('restore from As-Built backup instead');
  });

  it('should scan module firmware versions and return simulated firmware version strings', async () => {
    const modules = await fordF150Gen14Module.scanModuleVersions();
    expect(modules.length).toBeGreaterThan(0);
    const bcm = modules.find(m => m.id === '726');
    expect(bcm).toBeDefined();
    expect(bcm?.currentVersion).toContain('ML3T-14G000-AA');
  });

  it('should read complete As-Built block range snapshot for target module', async () => {
    const ipmaData = await fordF150Gen14Module.readModuleData('706');
    expect(Object.keys(ipmaData).length).toBeGreaterThanOrEqual(20);
    expect(ipmaData['706-01-01']).toBeDefined();

    const apimData = await fordF150Gen14Module.readModuleData('7D0');
    expect(Object.keys(apimData).length).toBeGreaterThanOrEqual(36);
    expect(apimData['7D0-09-01']).toBeDefined();
    expect(apimData['7D0-01-01']).toBeDefined();

    const bcmData = await fordF150Gen14Module.readModuleData('726');
    expect(Object.keys(bcmData).length).toBeGreaterThanOrEqual(140);
    expect(bcmData['726-01-01']).toBeDefined();
  });

  it('should batch read option lines across modules in simulation mode', async () => {
    const options = fordF150Gen14Module.optionsCatalog;
    const batchResult = await fordF150Gen14Module.readOptionLinesBatch!(options);

    expect(batchResult).toBeDefined();
    expect(Object.keys(batchResult).length).toBe(options.length);
    options.forEach(opt => {
      expect(batchResult[opt.targetAddress]).toBeDefined();
    });
  });

  it('should read option line in connected mode using parseObdPayloadBytes', async () => {
    const isSimSpy = vi.spyOn(obdBridge, 'isSimulationMode').mockReturnValue(false);
    const isConnSpy = vi.spyOn(obdBridge, 'isConnected').mockReturnValue(true);
    const setHeaderSpy = vi.spyOn(obdBridge, 'setHeader').mockResolvedValue(true);
    const setSessSpy = vi.spyOn(udsClient, 'setDiagnosticSession').mockResolvedValue(true);
    const readDidSpy = vi.spyOn(udsClient, 'readDataByIdentifier').mockResolvedValue('726 62 63 02 04 01 01 00 00 98');

    const result = await fordF150Gen14Module.readOptionLine('726-63-02', '726');

    expect(result).toBe('0401 0100 0098');

    isSimSpy.mockRestore();
    isConnSpy.mockRestore();
    setHeaderSpy.mockRestore();
    setSessSpy.mockRestore();
    readDidSpy.mockRestore();
  });

  it('should batch read option lines in connected mode issuing setDiagnosticSession once per module', async () => {
    const isSimSpy = vi.spyOn(obdBridge, 'isSimulationMode').mockReturnValue(false);
    const isConnSpy = vi.spyOn(obdBridge, 'isConnected').mockReturnValue(true);
    const setHeaderSpy = vi.spyOn(obdBridge, 'setHeader').mockResolvedValue(true);
    const setSessSpy = vi.spyOn(udsClient, 'setDiagnosticSession').mockResolvedValue(true);
    const readDidSpy = vi.spyOn(udsClient, 'readDataByIdentifier').mockResolvedValue('62 63 02 04 01 01 00 00 98');

    const options = [fordF150Gen14Module.optionsCatalog[0]];
    const batchResult = await fordF150Gen14Module.readOptionLinesBatch!(options);

    expect(batchResult['726-63-02']).toBe('0401 0100 0098');
    // Verify 1003 (session 3) and 1001 (session 1) were set exactly once for this module
    expect(setSessSpy).toHaveBeenCalledWith(0x03);
    expect(setSessSpy).toHaveBeenCalledWith(0x01);
    expect(setSessSpy).toHaveBeenCalledTimes(2);

    isSimSpy.mockRestore();
    isConnSpy.mockRestore();
    setHeaderSpy.mockRestore();
    setSessSpy.mockRestore();
    readDidSpy.mockRestore();
  });
});

