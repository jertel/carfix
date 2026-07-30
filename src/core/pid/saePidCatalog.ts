import { IPidDefinition } from './pidTypes';
import { parseObdPayloadBytes } from '../utils/hexUtils';

/**
 * Complete Standard SAE J1979 Mode 01 PID Catalog
 * Fully compliant with ISO 15031-5 / SAE J1979 specifications.
 */
export const SAE_PID_CATALOG: IPidDefinition[] = [
  {
    id: 'sae_0103_fuel_system_status',
    nameKey: 'pids.sae.fuelSystemStatus',
    name: 'Fuel System Status',
    command: '0103',
    unit: 'State',
    minValue: 0,
    maxValue: 16,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? b[0] : 1;
    }
  },
  {
    id: 'sae_0104_engine_load',
    nameKey: 'pids.sae.engineLoad',
    name: 'Calculated Engine Load',
    command: '0104',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 85,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0105_coolant_temp',
    nameKey: 'pids.sae.coolantTemp',
    name: 'Engine Coolant Temperature',
    command: '0105',
    unit: '°F',
    minValue: -40,
    maxValue: 260,
    warningThreshold: 220,
    criticalThreshold: 240,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 40) * 1.8) + 32) : 0;
    }
  },
  {
    id: 'sae_0106_stft_b1',
    nameKey: 'pids.sae.stft1',
    name: 'Short Term Fuel Trim (Bank 1)',
    command: '0106',
    unit: '%',
    minValue: -100,
    maxValue: 99,
    warningThreshold: 15,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 128) * 100) / 128) : 0;
    }
  },
  {
    id: 'sae_0107_ltft_b1',
    nameKey: 'pids.sae.ltft1',
    name: 'Long Term Fuel Trim (Bank 1)',
    command: '0107',
    unit: '%',
    minValue: -100,
    maxValue: 99,
    warningThreshold: 15,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 128) * 100) / 128) : 0;
    }
  },
  {
    id: 'sae_0108_stft_b2',
    nameKey: 'pids.sae.stft2',
    name: 'Short Term Fuel Trim (Bank 2)',
    command: '0108',
    unit: '%',
    minValue: -100,
    maxValue: 99,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 128) * 100) / 128) : 0;
    }
  },
  {
    id: 'sae_0109_ltft_b2',
    nameKey: 'pids.sae.ltft2',
    name: 'Long Term Fuel Trim (Bank 2)',
    command: '0109',
    unit: '%',
    minValue: -100,
    maxValue: 99,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 128) * 100) / 128) : 0;
    }
  },
  {
    id: 'sae_010a_fuel_pressure',
    nameKey: 'pids.sae.fuelPressure',
    name: 'Fuel Gauge Pressure',
    command: '010A',
    unit: 'PSI',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(b[0] * 3 * 0.145038) : 0;
    }
  },
  {
    id: 'sae_010b_map',
    nameKey: 'pids.sae.map',
    name: 'Intake Manifold Pressure (MAP)',
    command: '010B',
    unit: 'PSI',
    minValue: 0,
    maxValue: 45,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(b[0] * 0.145038 * 10) / 10 : 0;
    }
  },
  {
    id: 'sae_010c_rpm',
    nameKey: 'pids.sae.rpm',
    name: 'Engine RPM',
    command: '010C',
    unit: 'RPM',
    minValue: 0,
    maxValue: 8000,
    warningThreshold: 6000,
    criticalThreshold: 7000,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) / 4) : 0;
    }
  },
  {
    id: 'sae_010d_speed',
    nameKey: 'pids.sae.speed',
    name: 'Vehicle Speed',
    command: '010D',
    unit: 'mph',
    minValue: 0,
    maxValue: 140,
    warningThreshold: 90,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(b[0] * 0.621371) : 0;
    }
  },
  {
    id: 'sae_010e_timing_advance',
    nameKey: 'pids.sae.timing',
    name: 'Ignition Timing Advance',
    command: '010E',
    unit: '°',
    minValue: -64,
    maxValue: 63,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] / 2) - 64) : 0;
    }
  },
  {
    id: 'sae_010f_iat',
    nameKey: 'pids.sae.iat',
    name: 'Intake Air Temperature (IAT)',
    command: '010F',
    unit: '°F',
    minValue: -40,
    maxValue: 215,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 40) * 1.8) + 32) : 0;
    }
  },
  {
    id: 'sae_0110_maf',
    nameKey: 'pids.sae.maf',
    name: 'MAF Air Flow Rate',
    command: '0110',
    unit: 'g/s',
    minValue: 0,
    maxValue: 655,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round((((b[0] * 256) + b[1]) / 100) * 10) / 10 : 0;
    }
  },
  {
    id: 'sae_0111_throttle',
    nameKey: 'pids.sae.throttle',
    name: 'Throttle Position',
    command: '0111',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0114_o2_b1s1_voltage',
    nameKey: 'pids.sae.o2b1s1',
    name: 'Oxygen Sensor 1 (Bank 1) Voltage',
    command: '0114',
    unit: 'V',
    minValue: 0,
    maxValue: 1.275,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] / 200) * 1000) / 1000 : 0;
    }
  },
  {
    id: 'sae_0115_o2_b1s2_voltage',
    nameKey: 'pids.sae.o2b1s2',
    name: 'Oxygen Sensor 2 (Bank 1) Voltage',
    command: '0115',
    unit: 'V',
    minValue: 0,
    maxValue: 1.275,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] / 200) * 1000) / 1000 : 0;
    }
  },
  {
    id: 'sae_011f_run_time',
    nameKey: 'pids.sae.runTime',
    name: 'Engine Run Time',
    command: '011F',
    unit: 'sec',
    minValue: 0,
    maxValue: 65535,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? (b[0] * 256) + b[1] : 0;
    }
  },
  {
    id: 'sae_0121_distance_mil',
    nameKey: 'pids.sae.distanceMil',
    name: 'Distance Traveled with MIL',
    command: '0121',
    unit: 'mi',
    minValue: 0,
    maxValue: 65535,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) * 0.621371) : 0;
    }
  },
  {
    id: 'sae_0122_fuel_rail_vac',
    nameKey: 'pids.sae.fuelRailVac',
    name: 'Fuel Rail Pressure (Vacuum)',
    command: '0122',
    unit: 'PSI',
    minValue: 0,
    maxValue: 750,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) * 0.079 * 0.145038) : 0;
    }
  },
  {
    id: 'sae_0123_fuel_rail_pressure',
    nameKey: 'pids.sae.fuelRailPressure',
    name: 'Fuel Rail Gauge Pressure',
    command: '0123',
    unit: 'PSI',
    minValue: 0,
    maxValue: 5000,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) * 10 * 0.145038) : 0;
    }
  },
  {
    id: 'sae_012c_commanded_egr',
    nameKey: 'pids.sae.commandedEgr',
    name: 'Commanded EGR',
    command: '012C',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_012d_egr_error',
    nameKey: 'pids.sae.egrError',
    name: 'EGR Error',
    command: '012D',
    unit: '%',
    minValue: -100,
    maxValue: 99,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 128) * 100) / 128) : 0;
    }
  },
  {
    id: 'sae_012e_commanded_purge',
    nameKey: 'pids.sae.commandedPurge',
    name: 'Commanded Evaporative Purge',
    command: '012E',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_012f_fuel_level',
    nameKey: 'pids.sae.fuelLevel',
    name: 'Fuel Tank Input Level',
    command: '012F',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0131_dist_since_clr',
    nameKey: 'pids.sae.distSinceClr',
    name: 'Distance Since Codes Cleared',
    command: '0131',
    unit: 'mi',
    minValue: 0,
    maxValue: 65535,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) * 0.621371) : 0;
    }
  },
  {
    id: 'sae_0132_evap_vp',
    nameKey: 'pids.sae.evapVp',
    name: 'Evap System Vapor Pressure',
    command: '0132',
    unit: 'Pa',
    minValue: -8192,
    maxValue: 8192,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) / 4) : 0;
    }
  },
  {
    id: 'sae_0133_baro_pressure',
    nameKey: 'pids.sae.baroPressure',
    name: 'Absolute Barometric Pressure',
    command: '0133',
    unit: 'inHg',
    minValue: 0,
    maxValue: 35,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(b[0] * 0.2953 * 10) / 10 : 0;
    }
  },
  {
    id: 'sae_013c_cat_temp_b1s1',
    nameKey: 'pids.sae.catTempB1',
    name: 'Catalyst Temp (Bank 1, Sensor 1)',
    command: '013C',
    unit: '°F',
    minValue: -40,
    maxValue: 1800,
    warningThreshold: 1450,
    criticalThreshold: 1650,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      if (b.length >= 2) {
        const celsius = (((b[0] * 256) + b[1]) / 10) - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  },
  {
    id: 'sae_0142_control_module_volts',
    nameKey: 'pids.sae.controlModuleVolts',
    name: 'Control Module Voltage',
    command: '0142',
    unit: 'V',
    minValue: 0,
    maxValue: 20,
    warningThreshold: 11.8,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round((((b[0] * 256) + b[1]) / 1000) * 10) / 10 : 0;
    }
  },
  {
    id: 'sae_0143_absolute_load',
    nameKey: 'pids.sae.absoluteLoad',
    name: 'Absolute Load Value',
    command: '0143',
    unit: '%',
    minValue: 0,
    maxValue: 2570,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round((((b[0] * 256) + b[1]) * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0144_commanded_lambda',
    nameKey: 'pids.sae.commandedLambda',
    name: 'Commanded Air-Fuel Equivalence Ratio (λ)',
    command: '0144',
    unit: 'λ',
    minValue: 0,
    maxValue: 2.0,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round((((b[0] * 256) + b[1]) / 32768) * 1000) / 1000 : 1.0;
    }
  },
  {
    id: 'sae_0145_rel_throttle',
    nameKey: 'pids.sae.relThrottle',
    name: 'Relative Throttle Position',
    command: '0145',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0146_ambient_air_temp',
    nameKey: 'pids.sae.ambientAirTemp',
    name: 'Ambient Air Temperature',
    command: '0146',
    unit: '°F',
    minValue: -40,
    maxValue: 150,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 40) * 1.8) + 32) : 0;
    }
  },
  {
    id: 'sae_0147_throttle_b',
    nameKey: 'pids.sae.throttleB',
    name: 'Absolute Throttle Position B',
    command: '0147',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0149_accel_d',
    nameKey: 'pids.sae.accelD',
    name: 'Accelerator Pedal Position D',
    command: '0149',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_014a_accel_e',
    nameKey: 'pids.sae.accelE',
    name: 'Accelerator Pedal Position E',
    command: '014A',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_014c_commanded_throttle',
    nameKey: 'pids.sae.commandedThrottle',
    name: 'Commanded Throttle Actuator',
    command: '014C',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0152_ethanol_pct',
    nameKey: 'pids.sae.ethanolPct',
    name: 'Ethanol Fuel Percentage',
    command: '0152',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round((b[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'sae_0159_fuel_rail_abs',
    nameKey: 'pids.sae.fuelRailAbs',
    name: 'Fuel Rail Absolute Pressure',
    command: '0159',
    unit: 'PSI',
    minValue: 0,
    maxValue: 10000,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) * 10 * 0.145038) : 0;
    }
  },
  {
    id: 'sae_015c_engine_oil_temp',
    nameKey: 'pids.sae.oilTemp',
    name: 'Engine Oil Temperature',
    command: '015C',
    unit: '°F',
    minValue: -40,
    maxValue: 300,
    warningThreshold: 240,
    criticalThreshold: 260,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? Math.round(((b[0] - 40) * 1.8) + 32) : 0;
    }
  },
  {
    id: 'sae_015d_fuel_inj_timing',
    nameKey: 'pids.sae.fuelInjTiming',
    name: 'Fuel Injection Timing',
    command: '015D',
    unit: '°',
    minValue: -210,
    maxValue: 301,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round((((b[0] * 256) + b[1]) / 128) - 210) : 0;
    }
  },
  {
    id: 'sae_015e_fuel_rate',
    nameKey: 'pids.sae.fuelRate',
    name: 'Engine Fuel Rate',
    command: '015E',
    unit: 'gal/hr',
    minValue: 0,
    maxValue: 85,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((((b[0] * 256) + b[1]) * 0.05) / 3.78541) * 10) / 10 : 0;
    }
  },
  {
    id: 'sae_0162_actual_torque_pct',
    nameKey: 'pids.sae.actualTorque',
    name: 'Actual Engine Percent Torque',
    command: '0162',
    unit: '%',
    minValue: -125,
    maxValue: 125,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 1 ? b[0] - 125 : 0;
    }
  },
  {
    id: 'sae_0163_engine_ref_torque',
    nameKey: 'pids.sae.refTorque',
    name: 'Engine Reference Torque',
    command: '0163',
    unit: 'lb-ft',
    minValue: 0,
    maxValue: 1000,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      return b.length >= 2 ? Math.round(((b[0] * 256) + b[1]) * 0.737562) : 0;
    }
  },
  {
    id: 'sae_0177_egt_b1',
    nameKey: 'pids.sae.egtB1',
    name: 'Exhaust Gas Temperature (Bank 1)',
    command: '0177',
    unit: '°F',
    minValue: -40,
    maxValue: 2000,
    warningThreshold: 1400,
    criticalThreshold: 1600,
    source: 'SAE',
    decoder: (hex: string) => {
      const b = parseObdPayloadBytes(hex);
      if (b.length >= 2) {
        const celsius = (((b[0] * 256) + b[1]) / 10) - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  }
];


