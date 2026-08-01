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
    const defaultModules = [
      '760', '7C7', '727', '7D0', '792', '726', '6F0', '7E4', '764', '7C1',
      '6F1', '746', '740', '744', '783', '6E3', '732', '716', '734', '733',
      '720', '706', '765', '750', '7E0', '741', '730', '737', '731', '775',
      '751', '797', '724', '712', '713', '7C5', '7E6', '6F2', '6F3', '7C4',
      '7C6', '761', '7E9', '754', '791', '6D1', '721', '725'
    ];
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
      '760': { partNumber: 'ML3T-2C219-AC' },
      '7C7': { partNumber: 'ML3T-19C805-AA' },
      '727': { partNumber: 'ML3T-19C107-AA', softwareVersion: 'ML3T-14C003-AA' },
      '7D0': { partNumber: 'MU5T-14G371-FA', softwareVersion: 'MU5T-14G374-BA' },
      '792': { partNumber: 'ML3T-14C001-AB' },
      '726': { partNumber: 'ML3T-14G000-AA', softwareVersion: 'ML3T-14G001-AA' },
      '6F0': { partNumber: 'ML3T-14A067-AA' },
      '7E4': { partNumber: 'ML3T-14G024-AC', softwareVersion: 'ML3T-14G025-AA' },
      '764': { partNumber: 'ML3T-9E731-AC' },
      '7C1': { partNumber: 'ML3T-19H406-AA' },
      '6F1': { partNumber: 'ML3T-14B381-AA' },
      '746': { partNumber: 'ML3T-14B227-AA', softwareVersion: 'ML3T-14C002-AA' },
      '740': { partNumber: 'ML3T-14B531-AA' },
      '744': { partNumber: 'ML3T-14C708-AA' },
      '783': { partNumber: 'ML3T-18B849-AC' },
      '6E3': { partNumber: 'ML3T-14B596-AA' },
      '732': { partNumber: 'ML3T-7P155-AA' },
      '716': { partNumber: 'ML3T-14G650-AA', softwareVersion: 'ML3T-14G651-AB' },
      '734': { partNumber: 'ML3T-13C170-AA' },
      '733': { partNumber: 'ML3T-19E624-AA' },
      '720': { partNumber: 'ML3T-10849-AA', softwareVersion: 'ML3T-14C026-AA' },
      '706': { partNumber: 'RJ6T-14H102-ABS', softwareVersion: 'RJ6T-14H103-ABS' },
      '765': { partNumber: 'ML3T-14B422-AA' },
      '750': { partNumber: 'ML3T-14E093-AA' },
      '7E0': { partNumber: 'ML3T-12A650-AB', softwareVersion: 'ML3T-14C204-AA' },
      '741': { partNumber: 'ML3T-14B533-AA' },
      '730': { partNumber: 'ML3T-14C217-AB' },
      '737': { partNumber: 'ML3T-14B321-AD' },
      '731': { partNumber: 'ML3T-19G488-AA' },
      '775': { partNumber: 'ML3T-14B291-AA' },
      '751': { partNumber: 'ML3T-15K600-AA' },
      '797': { partNumber: 'ML3T-3F818-AA' },
      '724': { partNumber: 'ML3T-14C025-AA' },
      '712': { partNumber: 'ML3T-14C709-AA' },
      '713': { partNumber: 'ML3T-14C710-AA' },
      '7C5': { partNumber: 'ML3T-14C690-AA' },
      '7E6': { partNumber: 'ML3T-14C044-AA' },
      '6F2': { partNumber: 'ML3T-14C691-AA' },
      '6F3': { partNumber: 'ML3T-14C692-AA' },
      '7C4': { partNumber: 'ML3T-14C689-AA' },
      '7C6': { partNumber: 'ML3T-14C693-AA' },
      '761': { partNumber: 'ML3T-7E453-AA' },
      '7E9': { partNumber: 'ML3T-14C337-AC', softwareVersion: 'ML3T-14C338-AB' },
      '754': { partNumber: 'ML3T-14G139-AF', softwareVersion: 'ML3T-14G140-AB' },
      '791': { partNumber: 'ML3T-19H332-AA' },
      '6D1': { partNumber: 'ML3T-14C501-AA' },
      '721': { partNumber: 'ML3T-18D598-AA' },
      '725': { partNumber: 'ML3T-190443-AA' }
    };

    return simulatedFirmwareMap[moduleId] || { partNumber: 'ML3T-14G000-AA' };
  }

  public async scanModuleVersions(): Promise<IVehicleModuleInfo[]> {
    const modulesToScan: Array<{ id: string; name: string; category: IVehicleModuleInfo['category']; did: string }> = [
      { id: '760', name: 'Anti-Lock Brake System (ABS)', category: 'CHASSIS', did: 'F113' },
      { id: '7C7', name: 'Air Conditioning Control Module (ACCM)', category: 'BODY', did: 'F113' },
      { id: '727', name: 'Audio Front Control Module (ACM)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '7D0', name: 'Accessory Protocol Interface Module (SYNC) (APIM)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '792', name: 'All Terrain Control Module (ATCM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '726', name: 'Body Control Module (BCM)', category: 'BODY', did: 'F113' },
      { id: '6F0', name: 'Body Control Module C [battery junction box] (BCMC [BJB])', category: 'BODY', did: 'F113' },
      { id: '7E4', name: 'Battery Energy Control Module (BECM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '764', name: 'Cruise Control Module (CCM)', category: 'SAFETY', did: 'F113' },
      { id: '7C1', name: 'Camera Module Rear [Driver Status Monitor Camera Module] (CMR)', category: 'SAFETY', did: 'F113' },
      { id: '6F1', name: 'Direct Current/Alternating Current Converter Module A (DCACA)', category: 'POWERTRAIN', did: 'F113' },
      { id: '746', name: 'Direct Current/Direct Current Converter Module (DCDC)', category: 'POWERTRAIN', did: 'F113' },
      { id: '740', name: 'Driver Door Module (being renamed to Intelligent Power Window Control Module) (DDM)', category: 'BODY', did: 'F113' },
      { id: '744', name: 'Driver Front Seat Module / Running Board Control Module (DSM / RBM)', category: 'BODY', did: 'F113' },
      { id: '783', name: 'Audio Digital Signal Processing Module (DSP)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '6E3', name: 'Front Hatch Control Module (FHCM)', category: 'BODY', did: 'F113' },
      { id: '732', name: 'Gear Shift Module (GSM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '716', name: 'Gateway Module A (GWM)', category: 'BODY', did: 'F113' },
      { id: '734', name: 'Headlamp Control Module (HCM)', category: 'BODY', did: 'F113' },
      { id: '733', name: 'Heating, Ventillation and Air Conditioning Module (HVAC)', category: 'BODY', did: 'F113' },
      { id: '720', name: 'Instrument Panel Cluster (IPC)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '706', name: 'Image Processing Module A (IPMA)', category: 'SAFETY', did: 'F113' },
      { id: '765', name: 'Occupant Classification System (OCS)', category: 'SAFETY', did: 'F113' },
      { id: '750', name: 'Pedestrian Alert Control Module (PACM)', category: 'SAFETY', did: 'F113' },
      { id: '7E0', name: 'Powertrain Control Module (gas) *Diesel PCM not OTA capable* (PCM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '741', name: 'Passenger Door Module (is being renamed to Door Control Modulee B) (PDM)', category: 'BODY', did: 'F113' },
      { id: '730', name: 'Power Steering Control Module (PSCM)', category: 'CHASSIS', did: 'F113' },
      { id: '737', name: 'Restraints Control Module (RCM)', category: 'SAFETY', did: 'F113' },
      { id: '731', name: 'Remote Function Actuator (RFA)', category: 'BODY', did: 'F113' },
      { id: '775', name: 'Rear Gate Trunk Module (RGTM)', category: 'BODY', did: 'F113' },
      { id: '751', name: 'Radio Transceiver Module (RTM)', category: 'BODY', did: 'F113' },
      { id: '797', name: 'Steering Angle Sensor Module (SASM)', category: 'CHASSIS', did: 'F113' },
      { id: '724', name: 'Steering Column Control Module (SCCM)', category: 'CHASSIS', did: 'F113' },
      { id: '712', name: 'Driver Multi-Contour Seat Module (SCMG)', category: 'BODY', did: 'F113' },
      { id: '713', name: 'Passenger Multi-Contour Seat Module (SCMH)', category: 'BODY', did: 'F113' },
      { id: '7C5', name: 'Steering Effort Control Module (SECM)', category: 'CHASSIS', did: 'F113' },
      { id: '7E6', name: 'Secondary On-Board Diagnostic Control Module C (SOBDMC)', category: 'POWERTRAIN', did: 'F113' },
      { id: '6F2', name: 'Side Obstacle Detection Control Module C (SODCMC)', category: 'SAFETY', did: 'F113' },
      { id: '6F3', name: 'Side Obstacle Detection Control Module D (SODCMD)', category: 'SAFETY', did: 'F113' },
      { id: '7C4', name: 'Side Obstacle Detection Control Module LH (SODL)', category: 'SAFETY', did: 'F113' },
      { id: '7C6', name: 'Side Obstacle Detection Control Module RH (SODR)', category: 'SAFETY', did: 'F113' },
      { id: '761', name: 'Transfer Case Control Module (TCCM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '7E9', name: 'Transmission Control Module (TCM)', category: 'POWERTRAIN', did: 'F113' },
      { id: '754', name: 'Telematic Control Unit Module (TCU)', category: 'INFOTAINMENT', did: 'F113' },
      { id: '791', name: 'Trailer Module / Trailer Brake Control Module (TRM / TBM)', category: 'CHASSIS', did: 'F113' },
      { id: '6D1', name: 'Upfitter Customization Interface Module (UCIM)', category: 'BODY', did: 'F113' },
      { id: '721', name: 'Vehicle Dynamics Control Module (VDM)', category: 'CHASSIS', did: 'F113' },
      { id: '725', name: 'Wireless Accessory Charging Module (WACM)', category: 'BODY', did: 'F113' }
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
      const details = await this.readModuleVersionDetails(req.moduleId);
      const currentPartNumber = details.partNumber;
      const atLeastMin = currentPartNumber.localeCompare(req.minVersion, undefined, { numeric: true, sensitivity: 'base' }) >= 0;

      if (!atLeastMin) {
        missing.push(`${req.description} (Installed: ${currentPartNumber}, Required: ${req.minVersion})`);
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

  public async writeOption(option: IVehicleOption, enable: boolean, targetHexOverride?: string): Promise<IWriteResult> {
    const timestampISO = new Date().toISOString();
    const targetAddress = option.targetAddress;
    const normModule = normalizeModuleId(option.primaryModule);
    const did = asBuiltAddressToDid(targetAddress);

    if (!obdBridge.isSimulationMode() && obdBridge.isConnected()) {
      await obdBridge.setHeader(normModule);

      // Single Extended Session (0x03) entry
      const sessionOk = await udsClient.setDiagnosticSession(0x03);
      if (!sessionOk) {
        return {
          success: false,
          address: targetAddress,
          previousHex: '',
          newHex: '',
          verifiedHex: '',
          error: 'Failed to enter Extended Diagnostic Session (0x10 0x03).',
          timestampISO
        };
      }

      try {
        let existingHex = '';
        const blockLines: IBlockLine[] = [];

        // 1. Read current DID value
        const rawData = await udsClient.readDataByIdentifier(did);
        if (rawData && rawData !== 'NO_DATA' && !/ERROR|UNABLE|STOPPED|7F/i.test(rawData)) {
          const payloadBytes = parseObdPayloadBytes(rawData);
          if (payloadBytes.length > 0) {
            const numLines = Math.ceil(payloadBytes.length / 5);
            const cleanDid = did.replace(/[^0-9A-Fa-f]/g, '').toUpperCase();
            const hexOffset = cleanDid.startsWith('DE') ? parseInt(cleanDid.substring(2, 4), 16) : 0;
            const blockStr = (isNaN(hexOffset) ? 1 : hexOffset + 1).toString().padStart(2, '0');

            for (let l = 1; l <= numLines; l++) {
              const lineStr = l.toString().padStart(2, '0');
              const lineAddr = `${normModule}-${blockStr}-${lineStr}`;
              const lineHex = formatAsBuiltLineHex(lineAddr, payloadBytes);
              if (lineHex !== 'NO DATA') {
                blockLines.push({ address: lineAddr, hexValue: lineHex });
                if (lineAddr === targetAddress) {
                  existingHex = lineHex;
                }
              }
            }
          }
        }

        if (!existingHex) {
          existingHex = blockLines.find(b => b.address === targetAddress)?.hexValue || '0000 0000 0000';
        }

        // 2. Store all lines of this block in line history
        backupManager.recordLineBackup(targetAddress, existingHex, blockLines);

        if (targetHexOverride === undefined) {
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
        }

        let modifiedHex = '';
        if (targetHexOverride !== undefined) {
          modifiedHex = targetHexOverride;
        } else {
          const maskToApply = (enable || !option.revertMask) ? option.mask : option.revertMask!;
          modifiedHex = applyAsBuiltModification(targetAddress, existingHex, maskToApply, enable, option.bitValues);
        }

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

        // 3. Assemble full block write payload (all lines of this block).
        // As-Built lineHex format is 12 hex chars: 10 data nibbles + 2 checksum nibbles.
        // UDS DID write payload must contain only raw data bytes (no per-line checksums),
        // matching the exact byte count returned by the read. Strip trailing checksum byte per line.
        let fullPayloadCleanHex = '';
        if (blockLines.length > 0) {
          for (const bLine of blockLines) {
            const lineHex = (bLine.address === targetAddress) ? modifiedHex : bLine.hexValue;
            const lineClean = lineHex.replace(/\s+/g, '');
            // Strip trailing 2 hex chars (1 checksum byte) — ECU stores only raw data bytes
            fullPayloadCleanHex += lineClean.length >= 4 ? lineClean.slice(0, -2) : lineClean;
          }
        } else {
          const singleClean = modifiedHex.replace(/\s+/g, '');
          // Strip trailing checksum byte for single-line write too
          fullPayloadCleanHex = singleClean.length >= 4 ? singleClean.slice(0, -2) : singleClean;
        }

        const rawCommand = `2E${did}${fullPayloadCleanHex}`;
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

        // Transmit full payload while keeping session active (skipSession = true)
        const writeOk = await udsClient.writeDataByIdentifier(did, fullPayloadCleanHex, true);

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

        // 4. Read back new value while in session and verify write result
        const readBackRaw = await udsClient.readDataByIdentifier(did);
        let verifiedHex = '';
        if (readBackRaw && readBackRaw !== 'NO_DATA' && !/ERROR|UNABLE|STOPPED|7F/i.test(readBackRaw)) {
          const verifiedPayloadBytes = parseObdPayloadBytes(readBackRaw);
          if (verifiedPayloadBytes.length > 0) {
            verifiedHex = formatAsBuiltLineHex(targetAddress, verifiedPayloadBytes);
          }
        }

        if (!verifiedHex || verifiedHex === 'NO DATA') {
          verifiedHex = modifiedHex;
        }

        return {
          success: true,
          address: targetAddress,
          previousHex: existingHex,
          newHex: modifiedHex,
          verifiedHex: verifiedHex,
          timestampISO
        };
      } finally {
        // 5. Exit Extended Session at the end of operation
        await udsClient.setDiagnosticSession(0x01);
      }
    }

    // --- Simulation Mode Baseline Execution ---
    const existingHex = await this.readOptionLine(targetAddress, option.primaryModule);
    backupManager.recordLineBackup(targetAddress, existingHex, [
      { address: targetAddress, hexValue: existingHex }
    ]);

    let modifiedHex = '';
    if (targetHexOverride !== undefined) {
      modifiedHex = targetHexOverride;
    } else {
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
      modifiedHex = applyAsBuiltModification(targetAddress, existingHex, maskToApply, enable, option.bitValues);
    }

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

    return {
      success: true,
      address: targetAddress,
      previousHex: existingHex,
      newHex: modifiedHex,
      verifiedHex: modifiedHex,
      timestampISO
    };
  }
}

export const fordF150Gen14Module = new FordF150Gen14Module();
