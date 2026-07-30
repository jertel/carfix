/**
 * Reusable Date, Timezone, and Number Formatting Utilities
 */

/**
 * Format an ISO date string or Date object with specified timezone and locale
 */
export function formatLocalizedDateTime(
  dateInput: string | Date,
  locale: string = 'en-US',
  timeZone?: string
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short',
    ...(timeZone ? { timeZone } : {})
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format time portion (HH:mm:ss) of ISO string or Date with locale and optional timezone
 */
export function formatLocalizedTime(
  dateInput: string | Date,
  locale: string = 'en-US',
  timeZone?: string
): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(date.getTime())) {
    return '';
  }

  const options: Intl.DateTimeFormatOptions = {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
    ...(timeZone ? { timeZone } : {})
  };

  return new Intl.DateTimeFormat(locale, options).format(date);
}

/**
 * Format numbers according to user locale
 */
export function formatLocalizedNumber(
  value: number,
  locale: string = 'en-US',
  options?: Intl.NumberFormatOptions
): string {
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format bytes into human-readable localized string (B, KB, MB)
 */
export function formatLocalizedBytes(
  bytes: number,
  locale: string = 'en-US'
): string {
  if (bytes < 1024) {
    return `${formatLocalizedNumber(bytes, locale)} B`;
  }
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${formatLocalizedNumber(Math.round(kb * 10) / 10, locale)} KB`;
  }
  const mb = kb / 1024;
  return `${formatLocalizedNumber(Math.round(mb * 100) / 100, locale)} MB`;
}

/**
 * Returns current user local IANA timezone string e.g. "America/New_York"
 */
export function getSystemTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
}
