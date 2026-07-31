import { describe, it, expect } from 'vitest';
import { t } from '../../src/core/i18n/translations';

describe('CarFix Localization (i18n) Helper', () => {
  it('should localize challenge strings in English', () => {
    expect(t('challenge.title', 'en')).toBe('Confirm Vehicle Write');
    expect(t('challenge.holdButton', 'en')).toBe('Hold to Authorize Write');
  });

  it('should localize challenge strings in Spanish', () => {
    expect(t('challenge.title', 'es')).toBe('Confirmar Escritura en Vehículo');
    expect(t('challenge.holdButton', 'es')).toBe('Mantenga Presionado para Autorizar');
  });

  it('should localize appSettings strings in English and Spanish', () => {
    expect(t('appSettings.vehicleTitle', 'en')).toBe('Vehicle');
    expect(t('appSettings.appTitle', 'en')).toBe('Application');
    expect(t('appSettings.darkTheme', 'es')).toBe('Tema Oscuro');
  });

  it('should localize modules.partNumber label in English and Spanish', () => {
    expect(t('modules.partNumber', 'en')).toBe('Part #');
    expect(t('modules.partNumber', 'es')).toBe('Nº de Pieza');
  });

  it('should localize history.blockLinesTitle in English and Spanish', () => {
    expect(t('history.blockLinesTitle', 'en')).toBe('Block Lines:');
    expect(t('history.blockLinesTitle', 'es')).toBe('Líneas del Bloque:');
  });

  it('should fallback to English for unknown keys or unsupported locales', () => {
    expect(t('challenge.title', 'fr')).toBe('Confirm Vehicle Write');
  });
});
