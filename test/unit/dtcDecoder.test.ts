import { describe, it, expect } from 'vitest';
import { decodeDtcRawByte, parseDtcResponseHex } from '../../src/core/obd/dtcDecoder';

describe('SAE J1979 Diagnostic Trouble Code (DTC) Decoder', () => {
  it('should decode Powertrain P0128 thermostat DTC correctly', () => {
    // P0128: 0x01, 0x28
    const dtc = decodeDtcRawByte(0x01, 0x28, 'STORED');
    expect(dtc.code).toBe('P0128');
    expect(dtc.category).toBe('POWERTRAIN');
    expect(dtc.status).toBe('STORED');
    expect(dtc.description).toContain('Thermostat');
  });

  it('should decode Network U0140 BCM communication DTC correctly', () => {
    // U0140: 0xC1, 0x40 (Bits 7-6 = 11 -> U)
    const dtc = decodeDtcRawByte(0xC1, 0x40, 'PENDING');
    expect(dtc.code).toBe('U0140');
    expect(dtc.category).toBe('NETWORK');
    expect(dtc.status).toBe('PENDING');
  });

  it('should parse raw hex response from Mode 03 into DTC array', () => {
    // 0128 C140 -> P0128 and U0140
    const rawHex = '0128C140';
    const parsed = parseDtcResponseHex(rawHex, 'STORED');
    expect(parsed.length).toBe(2);
    expect(parsed[0].code).toBe('P0128');
    expect(parsed[1].code).toBe('U0140');
  });
});
