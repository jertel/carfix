import { describe, it, expect } from 'vitest';
import {
  hexToAscii,
  parseObdPayloadBytes,
  asBuiltAddressToDid,
  normalizeModuleId,
  didToAsBuiltAddress,
  getModuleAbbreviation,
  getModuleAbbrevFromInfo,
  formatAsBuiltAddressWithAbbrev,
  formatAsBuiltLineHex
} from '../../src/core/utils/hexUtils';

describe('Hex ASCII Converter & OBD Response Parser', () => {
  it('should decode raw hex bytes into readable ASCII software part number', () => {
    const rawHex = '4D4C33542D3134473634372D4142';
    const decoded = hexToAscii(rawHex);
    expect(decoded).toBe('ML3T-14G647-AB');
  });

  it('should filter out non-printable control characters', () => {
    const rawHex = '004D4C33542D31303834392D414100';
    const decoded = hexToAscii(rawHex);
    expect(decoded).toBe('ML3T-10849-AA');
  });

  it('should strip ISO-TP multi-frame headers and CAN IDs from UDS firmware version responses', () => {
    const rawUds = '706 10 17 62 F1 13 4D 4C 33\n706 21 54 2D 31 34 47 36 34\n706 22 37 2D 41 42';
    const decoded = hexToAscii(rawUds);
    expect(decoded).toBe('ML3T-14G647-AB');
  });

  it('should strip CAN headers, PCI length bytes, and response headers for single-frame OBD PIDs', () => {
    const rawSpeed = '7E8 03 41 0D 00';
    const payload = parseObdPayloadBytes(rawSpeed);
    expect(payload).toEqual([0x00]);
  });

  it('should strip multi-frame line index prefixes for Mode 09 02 VIN responses', () => {
    const rawVin = '0: 49 02 01 00 00 00 31\n1: 46 54 46 57 31 45 44 34\n2: 4D 46 31 32 33 34 35 36';
    const decoded = hexToAscii(rawVin);
    expect(decoded).toContain('1FTFW1ED4MF123456');
  });

  it('should handle OBD error responses gracefully', () => {
    expect(parseObdPayloadBytes('NO DATA')).toEqual([]);
    expect(parseObdPayloadBytes('CAN ERROR')).toEqual([]);
    expect(parseObdPayloadBytes('UNABLE TO CONNECT')).toEqual([]);
  });

  it('should convert Ford As-Built addresses to DE-prefix DID hex strings dynamically', () => {
    expect(asBuiltAddressToDid('706-01-01')).toBe('DE00');
    expect(asBuiltAddressToDid('706-01-02')).toBe('DE00');
    expect(asBuiltAddressToDid('706-02-01')).toBe('DE01');
    expect(asBuiltAddressToDid('726-02-02')).toBe('DE01');
    expect(asBuiltAddressToDid('726-63-02')).toBe('DE3E');
    expect(asBuiltAddressToDid('7D0-DE14')).toBe('DE14');
  });

  it('should normalize module acronyms to 3-char CAN hex module IDs', () => {
    expect(normalizeModuleId('APIM')).toBe('7D0');
    expect(normalizeModuleId('BCM')).toBe('726');
    expect(normalizeModuleId('IPMA')).toBe('706');
    expect(normalizeModuleId('IPMB')).toBe('7B1');
    expect(normalizeModuleId('7D0')).toBe('7D0');
  });

  it('should map CAN module hex IDs to OEM abbreviations', () => {
    expect(getModuleAbbreviation('726')).toBe('BCM');
    expect(getModuleAbbreviation('7D0')).toBe('APIM');
    expect(getModuleAbbreviation('706')).toBe('IPMA');
    expect(getModuleAbbreviation('BCM')).toBe('BCM');
  });

  it('should resolve module abbreviation from module info object', () => {
    expect(getModuleAbbrevFromInfo({ id: '726', name: 'Body Control Module (BCM / BdyCM)' })).toBe('BCM');
    expect(getModuleAbbrevFromInfo({ id: '706', name: 'Image Processing Module A' })).toBe('IPMA');
    expect(getModuleAbbrevFromInfo({ id: '999', name: 'Custom Control Module (CCM)' })).toBe('CCM');
    expect(getModuleAbbrevFromInfo({ id: '999', name: 'Unknown Control' })).toBe('999');
  });

  it('should format As-Built line addresses with module abbreviations', () => {
    expect(formatAsBuiltAddressWithAbbrev('726-63-02')).toBe('BCM-63-02');
    expect(formatAsBuiltAddressWithAbbrev('7D0-01-01')).toBe('APIM-01-01');
  });

  it('should convert UDS DID hex strings back to As-Built line addresses dynamically', () => {
    expect(didToAsBuiltAddress('APIM', 'DE00', 1)).toBe('7D0-01-01');
    expect(didToAsBuiltAddress('7B1', 'DE01', 2)).toBe('7B1-02-02');
    expect(didToAsBuiltAddress('726', 'DE3E', 2)).toBe('726-63-02');
    expect(didToAsBuiltAddress('7D0', 'DE0F', 2)).toBe('7D0-16-02');
  });


  it('should format raw payload bytes into standard 12 hex digit As-Built lines for specific line numbers', () => {
    // 10 payload bytes where Line 2 (address 726-02-02) uses bytes 6-10 (indices 5..9)
    const payload = [0x00, 0x00, 0x00, 0x00, 0x00, 0x28, 0x3C, 0x11, 0x94, 0x02];
    const formattedLine2 = formatAsBuiltLineHex('726-02-02', payload);
    expect(formattedLine2).toBe('283C 1194 020F');

    // 5 payload bytes for line 1 + calculated checksum -> 12 hex digits
    const formatted5 = formatAsBuiltLineHex('726-01-01', [0x04, 0x01, 0x01, 0x00, 0x00]);
    expect(formatted5).toBe('0401 0100 003B');

    // Empty or out-of-bounds payload returns NO DATA
    expect(formatAsBuiltLineHex('726-01-01', [])).toBe('NO DATA');
    expect(formatAsBuiltLineHex('726-01-03', [0x04, 0x01, 0x01, 0x00, 0x00])).toBe('NO DATA');
  });

  it('should format shortened payload bytes (e.g. 1-byte response) into valid line with checksum', () => {
    const payload = [0x01];
    const formatted = formatAsBuiltLineHex('726-03-01', payload);
    expect(formatted).not.toBe('NO DATA');
    expect(formatted).toMatch(/^[0-9A-F]{4}$/);
  });

  it('should format multi-line UDS raw payload bytes into separate 5-byte data + 1-byte calculated checksum lines', () => {
    // 10 raw payload bytes from UDS DID DE3E read: 04 01 00 01 03 00 01 01 01 01
    const rawPayload = [0x04, 0x01, 0x00, 0x01, 0x03, 0x00, 0x01, 0x01, 0x01, 0x01];
    const line1Hex = formatAsBuiltLineHex('726-63-01', rawPayload);
    const line2Hex = formatAsBuiltLineHex('726-63-02', rawPayload);

    // Line 1 data must be 0401000103 + calculated checksum (2 hex chars)
    expect(line1Hex.replace(/\s+/g, '').substring(0, 10)).toBe('0401000103');
    expect(line1Hex.replace(/\s+/g, '').length).toBe(12);

    // Line 2 data must be 0001010101 + calculated checksum (2 hex chars)
    expect(line2Hex.replace(/\s+/g, '').substring(0, 10)).toBe('0001010101');
    expect(line2Hex.replace(/\s+/g, '').length).toBe(12);
  });
});
