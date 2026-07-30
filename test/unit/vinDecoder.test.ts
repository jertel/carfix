import { describe, it, expect } from 'vitest';
import { parseVinResponseHex } from '../../src/core/obd/obdBridge';

describe('ISO-TP Mode 09 02 VIN Decoder', () => {
  it('should parse multi-frame ISO 15765-4 VIN hex responses', () => {
    // Mode 09 02 multi-frame response payload for VIN '1FTFW1ED4MF123456'
    const rawMultiFrameHex = '49 02 01 00 00 00 31 49 02 02 46 54 46 57 31 45 44 34 4D 46 31 32 33 34 35 36';
    const vin = parseVinResponseHex(rawMultiFrameHex);

    expect(vin).toBe('1FTFW1ED4MF123456');
  });

  it('should return plain text 17-character VIN directly if present', () => {
    const rawPlainVin = '1FTFW1ED4MF123456';
    const vin = parseVinResponseHex(rawPlainVin);

    expect(vin).toBe('1FTFW1ED4MF123456');
  });

  it('should return empty string for invalid responses', () => {
    const invalidHex = 'NO DATA';
    const vin = parseVinResponseHex(invalidHex);

    expect(vin).toBe('');
  });
});
