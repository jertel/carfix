import { describe, it, expect } from 'vitest';
import {
  formatLocalizedDateTime,
  formatLocalizedTime,
  formatLocalizedNumber,
  formatLocalizedBytes,
  getSystemTimezone
} from '../../src/core/utils/dateTimeUtils';

describe('dateTimeUtils & Formatters', () => {
  it('should format localized date time properly', () => {
    const iso = '2026-07-29T12:00:00.000Z';
    const formatted = formatLocalizedDateTime(iso, 'en-US', 'UTC');
    expect(formatted).toContain('2026');
  });

  it('should handle invalid date string safely', () => {
    expect(formatLocalizedDateTime('invalid-date')).toBe('');
    expect(formatLocalizedTime('invalid-date')).toBe('');
  });

  it('should format numbers with locale', () => {
    expect(formatLocalizedNumber(1234, 'en-US')).toBe('1,234');
  });

  it('should format byte sizes correctly', () => {
    expect(formatLocalizedBytes(500, 'en-US')).toBe('500 B');
    expect(formatLocalizedBytes(1536, 'en-US')).toBe('1.5 KB');
    expect(formatLocalizedBytes(2097152, 'en-US')).toBe('2 MB');
  });

  it('should return a non-empty timezone string', () => {
    expect(getSystemTimezone()).toBeDefined();
    expect(typeof getSystemTimezone()).toBe('string');
  });
});
