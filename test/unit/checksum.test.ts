import { describe, it, expect } from 'vitest';
import { calculateFordChecksum, verifyFordChecksum, applyAsBuiltModification } from '../../src/core/obd/checksum';

describe('Ford As-Built Checksum Engine', () => {
  it('should correctly calculate checksum for known BCM line 726-63-02', () => {
    // Address 726-63-02 (0x07 + 0x26 + 0x63 + 0x02 = 0x92)
    // Data 0401 0100 00 (0x04 + 0x01 + 0x01 + 0x00 + 0x00 = 0x06)
    // Total sum = 0x98 (152 mod 256 = 152 = 0x98)
    const checksum = calculateFordChecksum('726-63-02', '0401010000');
    expect(checksum).toBe('98');
  });

  it('should verify valid As-Built lines and reject invalid checksums', () => {
    const validLine = '726-63-02 0401 0100 0098';
    const invalidLine = '726-63-02 0401 0100 00FF';

    expect(verifyFordChecksum(validLine)).toBe(true);
    expect(verifyFordChecksum(invalidLine)).toBe(false);
  });

  it('should apply bitmask modification without modifying preserved nibbles and recalculate checksum', () => {
    const address = '726-63-02';
    const originalHex = '0401 0100 0098';
    const mask = 'xxx0 xxxx xx--';
    const resultHex = applyAsBuiltModification(address, originalHex, mask, true, [{ 0: 0 }]);

    expect(resultHex.replace(/\s+/g, '').substring(0, 4)).toBe('0400');
    expect(verifyFordChecksum(`${address} ${resultHex}`)).toBe(true);
  });

  it('should preserve other bits in nibble when toggling bitValues on and off', () => {
    const address = '7D0-09-05';
    const originalHex = '0000 0010 016A'; // nibble 6 is 1 (0001), nibble 8 is 1 (0001)
    const mask = 'xxxx xx4x 2x--';
    const bitValues = [{ 2: 1 }, { 1: 1 }];

    // Toggle ON: set bit 2 of nibble 6 (0001 -> 0101 = 5), set bit 1 of nibble 8 (0001 -> 0011 = 3)
    const enabledHex = applyAsBuiltModification(address, originalHex, mask, true, bitValues);
    expect(enabledHex).toContain('0000 0050 03');

    // Toggle OFF: invert bit 2 of nibble 6 (0101 -> 0001 = 1), invert bit 1 of nibble 8 (0011 -> 0001 = 1)
    const disabledHex = applyAsBuiltModification(address, enabledHex, mask, false, bitValues);
    expect(disabledHex).toContain('0000 0010 01');
  });
});
