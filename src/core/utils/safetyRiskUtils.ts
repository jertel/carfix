/**
 * Vehicle Option Safety Risk Visual & Tooltip Mapping Helpers
 */

export function getSafetyIcon(level: string): string {
  switch (level) {
    case 'HIGH': return 'warning';
    case 'MEDIUM': return 'priority_high';
    default: return 'info';
  }
}

export function getSafetyIconColor(level: string): string {
  switch (level) {
    case 'HIGH': return 'negative';
    case 'MEDIUM': return 'warning';
    default: return 'info';
  }
}

export function getSafetyTooltip(level: string): string {
  switch (level) {
    case 'HIGH':
      return "This is a significant safety risk due to its impact on the car's driving behavior";
    case 'MEDIUM':
      return 'This carries moderate risk; exercise caution when modifying this setting';
    default:
      return 'This is a low risk convenience or aesthetic setting';
  }
}
