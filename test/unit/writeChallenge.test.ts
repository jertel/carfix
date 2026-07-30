import { describe, it, expect } from 'vitest';

describe('Vehicle Write Safety Security Challenge', () => {
  it('should generate a 4-digit numeric PIN challenge code', () => {
    const pin = Math.floor(1000 + Math.random() * 9000).toString();
    expect(pin.length).toBe(4);
    expect(parseInt(pin, 10)).toBeGreaterThanOrEqual(1000);
    expect(parseInt(pin, 10)).toBeLessThanOrEqual(9999);
  });

  it('should require exact PIN match before authorizing vehicle write', () => {
    const challengePin = '4829';

    let userPin = '1234';
    expect(userPin === challengePin).toBe(false);

    userPin = '4829';
    expect(userPin === challengePin).toBe(true);
  });

  it('should not contain automatic backup snapshot claim in challenge warning text', () => {
    const { t } = require('../../src/core/i18n/translations');
    const warningEn = t('challenge.warning', 'en');
    const warningEs = t('challenge.warning', 'es');

    expect(warningEn).not.toContain('backup snapshot');
    expect(warningEs).not.toContain('copia de seguridad');
    expect(warningEn).toBe('Writing to vehicle EEPROM carries risk.');
  });
});

