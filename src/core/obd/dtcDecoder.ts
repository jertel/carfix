export type DtcStatus = 'PENDING' | 'STORED' | 'PERMANENT';
export type DtcCategory = 'POWERTRAIN' | 'CHASSIS' | 'BODY' | 'NETWORK';

export interface IDtcCode {
  code: string;
  status: DtcStatus;
  description: string;
  category: DtcCategory;
}

const COMMON_DTC_DESCRIPTIONS: Record<string, { desc: string; category: DtcCategory }> = {
  'P0100': { desc: 'Mass or Volume Air Flow A Circuit Malfunction', category: 'POWERTRAIN' },
  'P0128': { desc: 'Coolant Thermostat Temperature Below Regulating Temperature', category: 'POWERTRAIN' },
  'P0300': { desc: 'Random / Multiple Cylinder Misfire Detected', category: 'POWERTRAIN' },
  'P0420': { desc: 'Catalyst System Efficiency Below Threshold (Bank 1)', category: 'POWERTRAIN' },
  'P0500': { desc: 'Vehicle Speed Sensor A Malfunction', category: 'POWERTRAIN' },
  'C0035': { desc: 'Left Front Wheel Speed Sensor Circuit', category: 'CHASSIS' },
  'B0001': { desc: 'Driver Frontal Stage 1 Deployment Control', category: 'BODY' },
  'U0100': { desc: 'Lost Communication with Engine Control Module / Powertrain Control Module', category: 'NETWORK' },
  'U0140': { desc: 'Lost Communication with Body Control Module', category: 'NETWORK' }
};

/**
 * Decodes standard 2-byte OBDII DTC payload into formatted code (e.g. P0128)
 */
export function decodeDtcRawByte(byte1: number, byte2: number, status: DtcStatus): IDtcCode {
  const typeBits = (byte1 & 0xC0) >> 6;
  const categoryChar = typeBits === 0 ? 'P' : typeBits === 1 ? 'C' : typeBits === 2 ? 'B' : 'U';
  const category: DtcCategory = typeBits === 0 ? 'POWERTRAIN' : typeBits === 1 ? 'CHASSIS' : typeBits === 2 ? 'BODY' : 'NETWORK';

  const digit2 = (byte1 & 0x30) >> 4;
  const digit3 = byte1 & 0x0F;
  const digit4 = (byte2 & 0xF0) >> 4;
  const digit5 = byte2 & 0x0F;

  const code = `${categoryChar}${digit2.toString(16)}${digit3.toString(16)}${digit4.toString(16)}${digit5.toString(16)}`.toUpperCase();

  const lookup = COMMON_DTC_DESCRIPTIONS[code];
  const description = lookup ? lookup.desc : `${category} Diagnostic Trouble Code`;

  return {
    code,
    status,
    description,
    category
  };
}

/**
 * Parses UDS Mode 03 / Mode 07 / Mode 0A raw hex payload strings
 */
export function parseDtcResponseHex(rawHex: string, status: DtcStatus): IDtcCode[] {
  const cleanHex = rawHex.replace(/[^0-9A-Fa-f]/g, '');
  const dtcs: IDtcCode[] = [];

  // Each DTC is encoded in 2 bytes (4 hex characters)
  for (let i = 0; i < cleanHex.length - 3; i += 4) {
    const b1 = parseInt(cleanHex.substring(i, i + 2), 16);
    const b2 = parseInt(cleanHex.substring(i + 2, i + 4), 16);

    if (b1 === 0 && b2 === 0) continue; // Empty slot filler

    const dtc = decodeDtcRawByte(b1, b2, status);
    if (!dtcs.some(d => d.code === dtc.code)) {
      dtcs.push(dtc);
    }
  }

  return dtcs;
}
