import { describe, it, expect } from 'vitest';
import { getSafetyIcon, getSafetyIconColor, getSafetyTooltip } from '../../src/core/utils/safetyRiskUtils';

describe('Safety Risk Utilities', () => {
  it('should return correct icon name for safety risk levels', () => {
    expect(getSafetyIcon('HIGH')).toBe('warning');
    expect(getSafetyIcon('MEDIUM')).toBe('priority_high');
    expect(getSafetyIcon('LOW')).toBe('info');
  });

  it('should return correct color for safety risk levels', () => {
    expect(getSafetyIconColor('HIGH')).toBe('negative');
    expect(getSafetyIconColor('MEDIUM')).toBe('warning');
    expect(getSafetyIconColor('LOW')).toBe('info');
  });

  it('should return descriptive tooltip text for safety risk levels', () => {
    expect(getSafetyTooltip('HIGH')).toContain('significant safety risk');
    expect(getSafetyTooltip('MEDIUM')).toContain('moderate risk');
    expect(getSafetyTooltip('LOW')).toContain('low risk');
  });
});
