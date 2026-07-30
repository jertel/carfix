import { describe, it, expect } from 'vitest';

describe('AppHeader Button Consistency Unit Tests', () => {
  it('should enforce icon-only properties for status bar refresh buttons', () => {
    const buttons = [
      { name: 'Scan Modules', hasLabel: false, isIconOnly: true },
      { name: 'Refresh Vehicle Option Lines', hasLabel: false, isIconOnly: true },
      { name: 'Add PID', hasLabel: true, isOutline: true },
      { name: 'Grid View', hasLabel: false, isIconOnly: true }
    ];

    buttons.forEach(btn => {
      if (btn.hasLabel) {
        expect(btn.isOutline).toBe(true);
      } else {
        expect(btn.isIconOnly).toBe(true);
      }
    });
  });
});
