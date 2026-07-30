import { describe, it, expect } from 'vitest';
import { PID_CATALOG } from '../../src/core/pid/pidCatalog';

describe('PID Catalog Decoder Engine', () => {
  it('should decode Engine RPM PID (010C)', () => {
    const rpmPid = PID_CATALOG.find(p => p.id === 'engine_rpm')!;
    // Hex 41 0C 1A F0 -> ((0x1A * 256) + 0xF0) / 4 = ((26 * 256) + 240) / 4 = 6896 / 4 = 1724
    const rpm = rpmPid.decoder('41 0C 1A F0');
    expect(rpm).toBe(1724);
  });

  it('should decode Vehicle Speed PID (010D)', () => {
    const speedPid = PID_CATALOG.find(p => p.id === 'vehicle_speed')!;
    // Hex 41 0D 64 -> 100 km/h * 0.621371 = 62.1371 mph -> 62 mph
    const mph = speedPid.decoder('41 0D 64');
    expect(mph).toBe(62);
  });

  it('should decode Coolant Temperature PID (0105)', () => {
    const coolantPid = PID_CATALOG.find(p => p.id === 'coolant_temp')!;
    // Hex 41 05 7B -> (123 - 40) = 83°C -> (83 * 1.8) + 32 = 181.4°F -> 181°F
    const tempF = coolantPid.decoder('41 05 7B');
    expect(tempF).toBe(181);
  });

  it('should decode Battery Voltage response', () => {
    const voltagePid = PID_CATALOG.find(p => p.id === 'battery_voltage')!;
    const volts = voltagePid.decoder('14.2V');
    expect(volts).toBe(14.2);
  });
});
