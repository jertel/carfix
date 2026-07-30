import { describe, it, expect } from 'vitest';
import { SAE_PID_CATALOG } from '../../src/core/pid/saePidCatalog';

describe('SAE J1979 PID Decoders & Metadata', () => {
  it('should verify all SAE catalog items contain source: SAE', () => {
    expect(SAE_PID_CATALOG.length).toBeGreaterThan(30);
    for (const pid of SAE_PID_CATALOG) {
      expect(pid.source).toBe('SAE');
    }
  });

  it('should decode Engine Load PID 0104', () => {
    const loadPid = SAE_PID_CATALOG.find(p => p.command === '0104')!;
    expect(loadPid.decoder('41 04 80')).toBe(50);
  });

  it('should decode Short Term Fuel Trim PID 0106', () => {
    const stftPid = SAE_PID_CATALOG.find(p => p.command === '0106')!;
    expect(stftPid.decoder('41 06 80')).toBe(0);
  });

  it('should decode Engine Oil Temp PID 015C', () => {
    const oilPid = SAE_PID_CATALOG.find(p => p.command === '015C')!;
    expect(oilPid.decoder('41 5C 82')).toBe(194);
  });
});
