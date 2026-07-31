import { IPidDefinition } from '../pid/pidTypes';

export type SafetyRating = 'LOW' | 'MEDIUM' | 'HIGH';

export interface IAsBuiltAddress {
  moduleId: string;       // e.g. "726" (BCM) or "706" (IPMA)
  moduleName: string;     // e.g. "Body Control Module"
  address: string;        // e.g. "726-63-02"
  defaultHex: string;     // e.g. "0401 0100 003B"
}

export interface IFirmwareRequirement {
  moduleId: string;            // Module address prefix e.g. "706"
  partNumberDid?: string;      // UDS DID for ECU software part number (e.g. "F113", "F188")
  minVersion: string;          // Minimum software/firmware version identifier e.g. "ML3T-14G647-AB"
  description: string;         // Descriptive title for UI display
}

export interface IVehicleModuleInfo {
  id: string;                  // Module CAN ID e.g. "726"
  name: string;                // Module title e.g. "Body Control Module (BCM)"
  category: 'BODY' | 'CHASSIS' | 'POWERTRAIN' | 'INFOTAINMENT' | 'SAFETY';
  partNumberDid?: string;      // Diagnostic DID e.g. "F113"
  currentVersion: string;      // Installed software/firmware version string
  partNumber?: string;         // Hardware / Assembly Part Number e.g. "ML3T-14G647-AB"
  softwareVersion?: string;    // Software Strategy Version e.g. "ML3T-14G648-BA"
  status: 'OK' | 'UPDATE_AVAILABLE' | 'UNKNOWN';
}

export interface IVehicleOption {
  id: string;
  name: string;                // Human readable title e.g. "Disable Double Horn Honk"
  description: string;         // Human readable description
  nameKey: string;             // Localization i18n key for name
  descriptionKey: string;      // Localization i18n key for description
  category: 'SAFETY' | 'LIGHTING' | 'CONVENIENCE' | 'DRIVER_ASSIST';
  primaryModule: string;       // Module address prefix e.g. "726"
  targetAddress: string;       // As-Built address e.g. "726-63-02"
  mask: string;                // Mask specifying target hex values at specific positions e.g. "xxx0 xxxx xx--"
  bitValues?: Array<Record<number, number>>; // Bit-value rules corresponding 1-to-1 to non-x mask positions e.g. [{ 2: 1 }, { 1: 1 }]
  revertMask?: string;         // Optional mask specifying target hex values when untoggling/disabling e.g. "xxx1 xxxx xx--"
  safetyLevel: SafetyRating;
  group?: string;              // Optional option group identifier e.g. "BlueCruise 1.4"
  prerequisites?: string[];    // Hardware/firmware requirements
  firmwareRequirements?: IFirmwareRequirement[]; // Structured firmware minimum version requirements
}

export interface IVehicleModule {
  id: string;
  name: string;
  supportedModels: string[];
  optionsCatalog: IVehicleOption[];
  pidCatalog?: IPidDefinition[]; // Pluggable vehicle module specific PIDs
  matchesVin(vin: string): boolean; // VIN prefix/pattern matching to automatically select module
  readModuleData(moduleId?: string, onProgress?: (currentAddress: string) => void): Promise<Record<string, string>>;
  readFirmwareVersion?(moduleId: string, didHex?: string): Promise<string>;
  scanModuleVersions?(): Promise<IVehicleModuleInfo[]>; // OEM module version scanner
  checkFirmwarePrerequisites?(option: IVehicleOption): Promise<{ satisfied: boolean; missing: string[] }>;
  readOptionLine?(targetAddress: string, primaryModule: string): Promise<string>;
  writeOption(option: IVehicleOption, enable: boolean): Promise<IWriteResult>;
}

export interface IWriteResult {
  success: boolean;
  address: string;
  previousHex: string;
  newHex: string;
  verifiedHex: string;
  error?: string;
  timestampISO: string;
}

export interface IBlockLine {
  address: string;
  hexValue: string;
}

export interface ILineHistoryEntry {
  timestampISO: string;
  hexValue: string;
  blockLines?: IBlockLine[];
}

export type ILineHistoryMap = Record<string, ILineHistoryEntry[]>;


