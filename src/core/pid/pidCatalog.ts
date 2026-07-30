import { IPidDefinition } from './pidTypes';
import { parseObdPayloadBytes } from '../utils/hexUtils';

/**
 * Standard & Ford OEM CAN-FD Live PID Catalog
 */
export const PID_CATALOG: IPidDefinition[] = [
  {
    id: 'engine_rpm',
    nameKey: 'pids.rpm.name',
    name: 'Engine RPM',
    command: '010C',
    header: '7DF',
    unit: 'RPM',
    minValue: 0,
    maxValue: 8000,
    warningThreshold: 6000,
    criticalThreshold: 7000,
    decoder: (hex: string) => {
      // 010C response e.g. "41 0C 1A F0" -> ((A * 256) + B) / 4
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 2) {
        return Math.round(((bytes[0] * 256) + bytes[1]) / 4);
      }
      return 0;
    }
  },
  {
    id: 'vehicle_speed',
    nameKey: 'pids.speed.name',
    name: 'Vehicle Speed',
    command: '010D',
    header: '7DF',
    unit: 'mph',
    minValue: 0,
    maxValue: 140,
    warningThreshold: 90,
    decoder: (hex: string) => {
      // 010D response e.g. "41 0D 41" -> km/h * 0.621371
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        return Math.round(bytes[0] * 0.621371);
      }
      return 0;
    }
  },
  {
    id: 'coolant_temp',
    nameKey: 'pids.coolant.name',
    name: 'Coolant Temperature',
    command: '0105',
    header: '7DF',
    unit: '°F',
    minValue: -40,
    maxValue: 260,
    warningThreshold: 220,
    criticalThreshold: 240,
    decoder: (hex: string) => {
      // 0105 response e.g. "41 05 7B" -> (A - 40) * 1.8 + 32
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        const celsius = bytes[0] - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  },
  {
    id: 'battery_voltage',
    nameKey: 'pids.voltage.name',
    name: 'Battery Voltage',
    command: 'ATRV',
    header: '7DF',
    unit: 'V',
    minValue: 9,
    maxValue: 16,
    warningThreshold: 11.8,
    decoder: (response: string) => {
      const match = response.match(/(\d+\.\d+)/);
      return match ? parseFloat(match[1]) : 12.6;
    }
  },
  {
    id: 'boost_pressure',
    nameKey: 'pids.boost.name',
    name: 'EcoBoost MAP / Boost',
    command: '010B',
    header: '7DF',
    unit: 'PSI',
    minValue: 0,
    maxValue: 30,
    warningThreshold: 22,
    decoder: (hex: string) => {
      // 010B response (kPa) -> PSI (kPa * 0.145038 - 14.7 atmospheric)
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        const psi = (bytes[0] * 0.145038) - 14.7;
        return Math.max(0, Math.round(psi * 10) / 10);
      }
      return 0;
    }
  },
  {
    id: 'trans_temp',
    nameKey: 'pids.transTemp.name',
    name: 'Transmission Fluid Temp',
    command: '221E1C',
    header: '7E0',
    unit: '°F',
    minValue: 0,
    maxValue: 260,
    warningThreshold: 215,
    criticalThreshold: 235,
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 2) {
        const raw = (bytes[0] * 256) + bytes[1];
        const celsius = (raw / 16) - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  },
  {
    id: 'fuel_level',
    nameKey: 'pids.fuelLevel.name',
    name: 'Fuel Tank Level',
    command: '012F',
    header: '7DF',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    decoder: (hex: string) => {
      // 012F response -> (A * 100) / 255
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        return Math.round((bytes[0] * 100) / 255);
      }
      return 0;
    }
  }
];


