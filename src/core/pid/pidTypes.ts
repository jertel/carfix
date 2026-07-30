/**
 * CarFix Live PID Data Types & Layout Preferences
 */

export type PidViewMode = 'READOUT' | 'GRAPH';
export type PidSourceType = 'SAE' | 'PROPRIETARY';

export interface IPidDefinition {
  id: string;
  nameKey: string;
  name: string;
  command: string;          // e.g. "010C" (RPM) or "224809" (HV SOC)
  header?: string;           // Optional CAN transmit header ID e.g. "7DF", "7E7", "7E4", "7E2", "726", "7E0"
  unit: string;
  minValue: number;
  maxValue: number;
  warningThreshold?: number;
  criticalThreshold?: number;
  source?: PidSourceType;   // 'SAE' for universal J1979 or 'PROPRIETARY' for module OEM DIDs
  decoder: (hexResponse: string) => number;
}

export interface IPidDataPoint {
  timestampISO: string;
  value: number;
}

export interface IPidState {
  definition: IPidDefinition;
  currentValue: number;
  history: IPidDataPoint[];
  viewMode: PidViewMode;
  orderIndex: number;
  isAvailable?: boolean;
}
