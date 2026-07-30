import { describe, it, expect } from 'vitest';
import { HYBRID_EV_PID_CATALOG } from '../../src/core/pid/hybridEvPidCatalog';

describe('Ford Hybrid & EV PID Decoders', () => {
  it('should decode Lowest HV Cell Voltage (22480E)', () => {
    const minCellPid = HYBRID_EV_PID_CATALOG.find(p => p.id === 'hev_cell_voltage_min')!;
    // 0x0EE8 (3816) -> 3816 / 1000 = 3.816 V
    expect(minCellPid.decoder('62 480E 0E E8')).toBe(3.816);
  });

  it('should decode Highest HV Cell Voltage (22480F)', () => {
    const maxCellPid = HYBRID_EV_PID_CATALOG.find(p => p.id === 'hev_cell_voltage_max')!;
    // 0x0EFF (3839) -> 3839 / 1000 = 3.839 V
    expect(maxCellPid.decoder('62 480F 0E FF')).toBe(3.839);
  });

  it('should decode Cell Voltage Delta / Imbalance (224813)', () => {
    const deltaPid = HYBRID_EV_PID_CATALOG.find(p => p.id === 'hev_cell_voltage_delta')!;
    // 0x0017 (23) -> 23 mV
    expect(deltaPid.decoder('62 4813 00 17')).toBe(23);
  });

  it('should decode 12V Auxiliary Battery State of Charge (12V SOC)', () => {
    const soc12vPid = HYBRID_EV_PID_CATALOG.find(p => p.id === 'ford_12v_battery_soc')!;
    expect(soc12vPid.decoder('62 1E09 D8')).toBe(85);
  });

  it('should define correct CAN headers for BECM, TMC, SOBDM, and BCM PIDs', () => {
    const hevSoc = HYBRID_EV_PID_CATALOG.find(p => p.id === 'hev_hv_soc')!;
    const motorSpeed = HYBRID_EV_PID_CATALOG.find(p => p.id === 'hev_traction_motor_rpm')!;
    const dcdcCurrent = HYBRID_EV_PID_CATALOG.find(p => p.id === 'hev_dcdc_current')!;
    const aux12v = HYBRID_EV_PID_CATALOG.find(p => p.id === 'ford_12v_battery_soc')!;

    expect(hevSoc.header).toBe('7E7');
    expect(motorSpeed.header).toBe('7E4');
    expect(dcdcCurrent.header).toBe('7E2');
    expect(aux12v.header).toBe('726');
  });
});
