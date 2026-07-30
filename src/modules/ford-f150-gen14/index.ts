import { IVehicleModule, IVehicleOption, IVehicleModuleInfo, IWriteResult } from '../../core/types/module';
import { F150_GEN14_OPTIONS } from './optionsCatalog';
import { FORD_F150_GEN14_PIDS } from './pidCatalog';
import { applyAsBuiltModification, verifyFordChecksum } from '../../core/obd/checksum';
import { backupManager } from '../../core/safety/backupManager';
import { udsClient, formatRawCommand } from '../../core/obd/udsClient';
import { obdBridge } from '../../core/obd/obdBridge';
import { useCarFixStore } from '../../stores/carfixStore';
import { hexToAscii, asBuiltAddressToDid, normalizeModuleId, parseObdPayloadBytes, formatAsBuiltLineHex } from '../../core/utils/hexUtils';

import { readModuleAsBuiltLinesDynamic } from './asBuiltRanges';

export class FordF150Gen14Module implements IVehicleModule {
  public readonly id = 'ford-f150-gen14';
  public readonly name = '2021+ Ford F-150 / F-150 Lightning (Gen 14)';
  public readonly supportedModels = ['F-150 (2021+)', 'F-150 Lightning (2022+)', 'F-150 PowerBoost (2021+)'];
  public readonly optionsCatalog = F150_GEN14_OPTIONS;
  public readonly pidCatalog = FORD_F150_GEN14_PIDS;

  public matchesVin(vin: string): boolean {
    if (!vin) return false;
    const clean = vin.toUpperCase().trim();
    if (clean.length < 3) return false;
    const wmi = clean.substring(0, 3);
    const validWmis = ['1FT', '1FD', '1FM', '2FT', '2FM', '3FT', '3FM', '1FA', '2FA', '3FA'];
    return validWmis.includes(wmi);
  }

  public async readModuleData(
    moduleId?: string,
    onProgress?: (currentAddress: string) => void
  ): Promise<Record<string, string>> {
    const defaultModules = ['726', '7D0', '706', '724', '720', '727', '783', '754', '7B1', '760', '730', '7E0', '7E1', '7E7'];
    const targetModules = (!moduleId || moduleId === 'ALL')
      ? defaultModules
      : [normalizeModuleId(moduleId)];

    const resultMap: Record<string, string> = {};

    // Dynamically read/probe As-Built line data for target modules
    for (const modId of targetModules) {
      const dynamicMap = await readModuleAsBuiltLinesDynamic(modId, onProgress);
      Object.assign(resultMap, dynamicMap);
    }

    return resultMap;
  }

  public async readFirmwareVersion(moduleId: string, didHex: string = 'F113'): Promise<string> {
    const details = await this.readModuleVersionDetails(moduleId);
    return details.softwareVersion ? `${details.partNumber} (${details.softwareVersion})` : details.partNumber;
  }

  public async readModuleVersionDetails(moduleId: string): Promise<{ partNumber: string; softwareVersion?: string }> {
    const normModule = normalizeModuleId(moduleId);
    if (!obdBridge.isSimulationMode() && obdBridge.isConnected()) {
      await obdBridge.setHeader(normModule);

      let assemblyPart = '';
      const rawAssembly = await udsClient.readDataByIdentifier('F113');
      if (rawAssembly && rawAssembly !== 'NO_DATA' && !/ERROR|UNABLE|STOPPED|7F/i.test(rawAssembly)) {
        assemblyPart = hexToAscii(rawAssembly).replace(/[^A-Za-z0-9\-]/g, '');
      }

      let strategySoftware = '';
      const rawStrategy = await udsClient.readDataByIdentifier('F188');
      if (rawStrategy && rawStrategy !== 'NO_DATA' && !/ERROR|UNABLE|STOPPED|7F/i.test(rawStrategy)) {
        strategySoftware = hexToAscii(rawStrategy).replace(/[^A-Za-z0-9\-]/g, '');
      }

      return {
        partNumber: assemblyPart || 'ML3T-14G000-AA',
        softwareVersion: strategySoftware || undefined
      };
    }

    const simulatedFirmwareMap: Record<string, { partNumber: string; softwareVersion?: string }> = {
      '7E0': { partNumber: 'ML3T-12A650-AB', softwareVersion: 'ML3T-14C204-AA' },
      '7E1': { partNumber: 'ML3T-14C337-AC', softwareVersion: 'ML3T-14C338-AB' },
      '7E2': { partNumber: 'ML3T-14B227-AA', softwareVersion: 'ML3T-14C002-AA' },
      '7E4': { partNumber: 'ML3T-14G024-AC', softwareVersion: 'ML3T-14G025-AA' },
      '7E7': { partNumber: 'ML3T-10B550-AB', softwareVersion: 'ML3T-10C988-AA' },
      '716': { partNumber: 'ML3T-14G650-AA', softwareVersion: 'ML3T-14G651-AB' },
      '724': { partNumber: 'ML3T-14C025-AA' },
      '726': { partNumber: 'ML3T-14G000-AA', softwareVersion: 'ML3T-14G001-AA' },
      '706': { partNumber: 'RJ6T-14H102-ACJ', softwareVersion: 'RJ6T-14H103-ACJ' },
      '7B1': { partNumber: 'ML3T-14F017-AB' },
      '720': { partNumber: 'ML3T-10849-AA', softwareVersion: 'ML3T-14C026-AA' },
      '7D0': { partNumber: 'MU5T-14G371-FA', softwareVersion: 'MU5T-14G374-BA' },
      '727': { partNumber: 'ML3T-19C107-AA', softwareVersion: 'ML3T-14C003-AA' },
      '783': { partNumber: 'ML3T-18B849-AC' },
      '754': { partNumber: 'ML3T-14G139-AF', softwareVersion: 'ML3T-14G140-AB' },
      '730': { partNumber: 'ML3T-14C217-AB' },
      '760': { partNumber: 'ML3T-2C219-AC' },
      '733': { partNumber: 'ML3T-19E624-AA' },
      '740': { partNumber: 'ML3T-14B531-AA' },
      '741': { partNumber: 'ML3T-14B533-AA' },
      '737': { partNumber: 'ML3T-14B321-AD' },
      '7C4': { partNumber: 'ML3T-14C689-AA' },
      '7C5': { partNumber: 'ML3T-14C690-AA' },
      '744': { partNumber: 'ML3T-14C708-AA' },
      '732': { partNumber: 'ML3T-7P155-AA' },
      '764': { partNumber: 'ML3T-9E731-AC' }
    };

    return simulatedFirmwareMap[moduleId] || { partNumber: 'ML3T-14G000-AA' };
  }

  public async scanModuleVersions(): Promise<IVehicleModuleInfo[]> {
    const modulesToScan: Array<{ id: string; name: string; category: IVehicleModuleInfo['category']; did: string }> = [
      { id: '7E0', name: 'Powertrain Control Module (PCM / ECM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '7E1', name: 'Transmission Control Module (TCM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '7E2', name: 'Secondary OBD Module B (SOBDM DC-DC)', category: 'POWERTRAIN', did: 'F113' },
      { id: '7E4', name: 'Traction Motor Control Module (TMC)', category: 'POWERTRAIN', did: 'F113' },
      { id: '7E7', name: 'Battery Energy Control Module (BECM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '732', name: 'Gear Shift Module (GSM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '726', name: 'Body Control Module (BCM / BdyCM)', category: 'BODY', did: 'F113' },
      { id: '716', name: 'Gateway Module A (GWM Central Gateway)', category: 'BODY', did: 'F113' },
      { id: '733', name: 'Climate Control Module (HVAC)', category: 'BODY', did: 'F113' },
      { id: '740', name: 'Driver Door Module (DDM)', category: 'BODY', did: 'F113' },
      { id: '741', name: 'Passenger Door Module (PDM)', category: 'BODY', did: 'F113' },
      { id: '744', name: 'Driver Seat Module (DSM Memory)', category: 'BODY', did: 'F113' },
      { id: '730', name: 'Power Steering Control Module (PSCM)', category: 'CHASSIS', did: 'F113' },
      { id: '760', name: 'Anti-Lock Brake System Module (ABS)', category: 'CHASSIS', did: 'F113' },
      { id: '724', name: 'Steering Column Control Module (SCCM)', category: 'CHASSIS', did: 'F113' },
      { id: '706', name: 'Image Processing Module A (IPMA Camera)', category: 'SAFETY', did: 'F113' },
      { id: '7B1', name: 'Image Processing Module B (IPMB 360 Camera)', category: 'SAFETY', did: 'F113' },
      { id: '737', name: 'Restraint Control Module (RCM Airbag)', category: 'SAFETY', did: 'F113' },
      { id: '7C4', name: 'Side Obstacle Detection Left (SODL BLIS)', category: 'SAFETY', did: 'F113' },
      { id: '7C5', name: 'Side Obstacle Detection Right (SODR BLIS)', category: 'SAFETY', did: 'F113' },
      { id: '764', name: 'Cruise Control Module (CCM Radar)', category: 'SAFETY', did: 'F113' },
      { id: '720', name: 'Instrument Panel Cluster (IPC)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '7D0', name: 'Accessory Protocol Interface (APIM Sync 4)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '727', name: 'Audio Control Module (ACM)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '783', name: 'Digital Signal Processing Module (DSP)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '754', name: 'Telematics Control Unit (TCU Modem)', category: 'INFOTAINMENT', did: 'F113' }
    ];

    const results: IVehicleModuleInfo[] = [];

    for (const item of modulesToScan) {
      const details = await this.readModuleVersionDetails(item.id);
      results.push({
        id: item.id,
        name: item.name,
        category: item.category,
        partNumberDid: item.did,
        partNumber: details.partNumber,
        softwareVersion: details.softwareVersion,
        currentVersion: details.softwareVersion ? `${details.partNumber} (${details.softwareVersion})` : details.partNumber,
        status: 'OK'
      });
    }

    return results;
  }

  public async checkFirmwarePrerequisites(option: IVehicleOption): Promise<{ satisfied: boolean; missing: string[] }> {
    if (!option.firmwareRequirements || option.firmwareRequirements.length === 0) {
      return { satisfied: true, missing: [] };
    }

    const missing: string[] = [];

    for (const req of option.firmwareRequirements) {
      const currentVersion = await this.readFirmwareVersion(req.moduleId, req.partNumberDid || 'F113');
      const atLeastMin = currentVersion.localeCompare(req.minVersion, undefined, { numeric: true, sensitivity: 'base' }) >= 0;

      if (!atLeastMin) {
        missing.push(`${req.description} (Installed: ${currentVersion}, Required: ${req.minVersion})`);
      }
    }

    return {
      satisfied: missing.length === 0,
      missing
    };
  }

  public async readOptionLine(targetAddress: string, primaryModule: string): Promise<string> {
    const normModule = normalizeModuleId(primaryModule);
    if (!obdBridge.isSimulationMode() && obdBridge.isConnected()) {
      await obdBridge.setHeader(normModule);
      await udsClient.setDiagnosticSession(0x03);
      try {
        const didHex = asBuiltAddressToDid(targetAddress);
        const rawData = await udsClient.readDataByIdentifier(didHex);
        if (rawData && rawData !== 'NO_DATA' && !/ERROR|UNABLE|STOPPED|7F/i.test(rawData)) {
          const payloadBytes = parseObdPayloadBytes(rawData);
          if (payloadBytes.length > 0) {
            return formatAsBuiltLineHex(targetAddress, payloadBytes);
          }
        }
        return 'NO DATA';
      } finally {
        await udsClient.setDiagnosticSession(0x01);
      }
    }
    const lines = await this.readModuleData(normModule);
    return lines[targetAddress] || '0000 0000 0000';
  }

  public async writeOption(option: IVehicleOption, enable: boolean): Promise<IWriteResult> {
    const timestampISO = new Date().toISOString();
    const targetAddress = option.targetAddress;
    const existingHex = await this.readOptionLine(targetAddress, option.primaryModule);

    // Record pre-modification line backup into history
    backupManager.recordLineBackup(targetAddress, existingHex);

    const firmwareCheck = await this.checkFirmwarePrerequisites(option);
    if (!firmwareCheck.satisfied) {
      return {
        success: false,
        address: targetAddress,
        previousHex: existingHex,
        newHex: '',
        verifiedHex: '',
        error: `Insufficient firmware version: ${firmwareCheck.missing.join('; ')}`,
        timestampISO
      };
    }

    if (!enable && !option.revertMask && !option.bitValues) {
      return {
        success: false,
        address: targetAddress,
        previousHex: existingHex,
        newHex: '',
        verifiedHex: '',
        error: 'Option does not support direct untoggling; restore from history instead.',
        timestampISO
      };
    }

    const maskToApply = (enable || !option.revertMask) ? option.mask : option.revertMask!;
    const modifiedHex = applyAsBuiltModification(targetAddress, existingHex, maskToApply, enable, option.bitValues);

    if (!verifyFordChecksum(`${targetAddress} ${modifiedHex}`)) {
      return {
        success: false,
        address: targetAddress,
        previousHex: existingHex,
        newHex: modifiedHex,
        verifiedHex: '',
        error: 'Checksum verification failed before payload transmission.',
        timestampISO
      };
    }

    await obdBridge.setHeader(option.primaryModule);
    const did = asBuiltAddressToDid(targetAddress);
    const cleanPayload = modifiedHex.replace(/\s+/g, '');
    const rawCommand = `2E${did}${cleanPayload}`;

    const store = useCarFixStore();
    store.lastSimulatedTransmit = {
      module: option.primaryModule,
      address: targetAddress,
      didHex: did,
      udsService: '0x2E (WriteDataByIdentifier)',
      rawCommand,
      formattedCommand: formatRawCommand(rawCommand),
      previousHex: existingHex,
      newHex: modifiedHex,
      timestampISO
    };

    const writeOk = await udsClient.writeDataByIdentifier(did, modifiedHex);

    if (!writeOk) {
      return {
        success: false,
        address: targetAddress,
        previousHex: existingHex,
        newHex: modifiedHex,
        verifiedHex: '',
        error: 'UDS WriteDataByIdentifier command rejected by ECU.',
        timestampISO
      };
    }

    if (udsClient.isWriteDisabled) {
      store.showTransmitPreview = true;
      return {
        success: true,
        address: targetAddress,
        previousHex: existingHex,
        newHex: modifiedHex,
        verifiedHex: modifiedHex,
        timestampISO
      };
    }

    await udsClient.ecuReset(0x03);
    await udsClient.setDiagnosticSession(0x01);

    // Re-read hex chars from vehicle to ensure verified hex value is accurately displayed
    const verifiedHex = await this.readOptionLine(targetAddress, option.primaryModule);

    return {
      success: true,
      address: targetAddress,
      previousHex: existingHex,
      newHex: modifiedHex,
      verifiedHex: verifiedHex || modifiedHex,
      timestampISO
    };
  }
}

export const fordF150Gen14Module = new FordF150Gen14Module();
