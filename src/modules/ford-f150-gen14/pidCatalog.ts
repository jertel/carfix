import { IPidDefinition } from '../../core/pid/pidTypes';
import { parseObdPayloadBytes } from '../../core/utils/hexUtils';

/**
 * Proprietary Ford F-150 / F-150 Lightning (Gen 14 / PowerBoost) OEM PID Catalog
 * Mode 22 Extended DIDs targeting BCM (726), BECM (7E7), TMC (7E4), and SOBDM (7E2).
 */
export const FORD_F150_GEN14_PIDS: IPidDefinition[] = [
  {
    id: 'ford_12v_battery_soc',
    nameKey: 'pids.ford.12vSoc',
    name: '12V Auxiliary Battery State of Charge (12V SOC)',
    command: '221E09',
    header: '726',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 45,
    criticalThreshold: 30,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 1 ? Math.round((bytes[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'hev_cell_voltage_min',
    nameKey: 'pids.hev.cellVoltageMin',
    name: 'Lowest HV Battery Cell Voltage',
    command: '22480E',
    header: '7E7',
    unit: 'V',
    minValue: 2.0,
    maxValue: 4.5,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 2 ? Math.round((((bytes[0] * 256) + bytes[1]) / 1000) * 1000) / 1000 : 0;
    }
  },
  {
    id: 'hev_cell_voltage_max',
    nameKey: 'pids.hev.cellVoltageMax',
    name: 'Highest HV Battery Cell Voltage',
    command: '22480F',
    header: '7E7',
    unit: 'V',
    minValue: 2.0,
    maxValue: 4.5,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 2 ? Math.round((((bytes[0] * 256) + bytes[1]) / 1000) * 1000) / 1000 : 0;
    }
  },
  {
    id: 'hev_cell_voltage_avg',
    nameKey: 'pids.hev.cellVoltageAvg',
    name: 'Average HV Battery Cell Voltage',
    command: '224812',
    header: '7E7',
    unit: 'V',
    minValue: 2.0,
    maxValue: 4.5,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 2 ? Math.round((((bytes[0] * 256) + bytes[1]) / 1000) * 1000) / 1000 : 0;
    }
  },
  {
    id: 'hev_cell_voltage_delta',
    nameKey: 'pids.hev.cellVoltageDelta',
    name: 'Cell Voltage Imbalance (Delta)',
    command: '224813',
    header: '7E7',
    unit: 'mV',
    minValue: 0,
    maxValue: 200,
    warningThreshold: 50,
    criticalThreshold: 100,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 2 ? (bytes[0] * 256) + bytes[1] : 0;
    }
  },
  {
    id: 'hev_hv_soc',
    nameKey: 'pids.hev.soc',
    name: 'HV Battery State of Charge (SOC)',
    command: '224809',
    header: '7E7',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 20,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 1 ? Math.round((bytes[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'hev_battery_current',
    nameKey: 'pids.hev.current',
    name: 'Traction Battery Current',
    command: '22480B',
    header: '7E7',
    unit: 'A',
    minValue: -400,
    maxValue: 400,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 2) {
        const raw = (bytes[0] * 256) + bytes[1];
        return Math.round(((raw - 32768) / 10) * 10) / 10;
      }
      return 0;
    }
  },
  {
    id: 'hev_battery_voltage',
    nameKey: 'pids.hev.voltage',
    name: 'HV Battery Pack Voltage',
    command: '22480D',
    header: '7E7',
    unit: 'V',
    minValue: 200,
    maxValue: 500,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 2 ? Math.round((((bytes[0] * 256) + bytes[1]) / 10) * 10) / 10 : 0;
    }
  },
  {
    id: 'hev_battery_soh',
    nameKey: 'pids.hev.soh',
    name: 'HV Battery State of Health (SOH)',
    command: '224801',
    header: '7E7',
    unit: '%',
    minValue: 0,
    maxValue: 100,
    warningThreshold: 80,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 1 ? Math.round((bytes[0] * 100) / 255) : 0;
    }
  },
  {
    id: 'hev_battery_temp_min',
    nameKey: 'pids.hev.tempMin',
    name: 'HV Battery Temp (Min)',
    command: '224805',
    header: '7E7',
    unit: '°F',
    minValue: -40,
    maxValue: 160,
    warningThreshold: 120,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        const celsius = bytes[0] - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  },
  {
    id: 'hev_battery_temp_max',
    nameKey: 'pids.hev.tempMax',
    name: 'HV Battery Temp (Max)',
    command: '224806',
    header: '7E7',
    unit: '°F',
    minValue: -40,
    maxValue: 160,
    warningThreshold: 125,
    criticalThreshold: 140,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        const celsius = bytes[0] - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  },
  {
    id: 'hev_traction_motor_rpm',
    nameKey: 'pids.hev.motorRpm',
    name: 'EV Traction Motor Speed',
    command: '224050',
    header: '7E4',
    unit: 'RPM',
    minValue: -12000,
    maxValue: 18000,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 2) {
        const raw = (bytes[0] * 256) + bytes[1];
        return raw - 32768;
      }
      return 0;
    }
  },
  {
    id: 'hev_inverter_temp',
    nameKey: 'pids.hev.inverterTemp',
    name: 'Power Electronics Inverter Temp',
    command: '224055',
    header: '7E4',
    unit: '°F',
    minValue: -40,
    maxValue: 220,
    warningThreshold: 175,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      if (bytes.length >= 1) {
        const celsius = bytes[0] - 40;
        return Math.round((celsius * 1.8) + 32);
      }
      return 0;
    }
  },
  {
    id: 'hev_dcdc_current',
    nameKey: 'pids.hev.dcdcCurrent',
    name: 'DC-DC Converter Output Current',
    command: '224902',
    header: '7E2',
    unit: 'A',
    minValue: 0,
    maxValue: 250,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 1 ? Math.round(bytes[0] * 1.0) : 0;
    }
  },
  {
    id: 'hev_efficiency_mi_kwh',
    nameKey: 'pids.hev.efficiency',
    name: 'EV Driving Efficiency',
    command: '224910',
    header: '7E2',
    unit: 'mi/kWh',
    minValue: 0,
    maxValue: 10,
    source: 'PROPRIETARY',
    decoder: (hex: string) => {
      const bytes = parseObdPayloadBytes(hex);
      return bytes.length >= 1 ? Math.round((bytes[0] / 10) * 10) / 10 : 0;
    }
  }
];


