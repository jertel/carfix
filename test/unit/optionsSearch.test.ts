import { describe, it, expect } from 'vitest';
import { IVehicleOption } from '../../src/core/types/module';

describe('Vehicle Options Search & Filtering Unit Tests', () => {
  const optionsList: IVehicleOption[] = [
    {
      id: 'f150_double_horn_honk',
      name: 'Double Horn Honk Removal',
      description: 'Prevents double horn honk when closing a door.',
      category: 'CONVENIENCE',
      primaryModule: '726',
      targetAddress: '726-63-02',
      mask: 'xxx0 xxxx xx--',
      safetyLevel: 'LOW'
    },
    {
      id: 'f150_enable_lane_change_assist',
      name: 'Lane Change Assist (IPMA) Enable',
      description: 'Enables lane change assist features in IPMA module.',
      category: 'DRIVER_ASSIST',
      primaryModule: '706',
      targetAddress: '706-01-01',
      mask: 'xExx xxxx xx--',
      group: 'BlueCruise 1.4',
      safetyLevel: 'HIGH'
    },
    {
      id: 'f150_disable_ese_engine_sound',
      name: 'Engine Sound Enhancement (ESE) Removal',
      description: 'Mutes simulated synthetic engine noise through cabin speakers.',
      category: 'CONVENIENCE',
      primaryModule: '727',
      targetAddress: '727-01-01',
      mask: 'xxxx x0xx xx--',
      safetyLevel: 'LOW'
    }
  ];

  function filterOptions(query: string, list: IVehicleOption[]) {
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter(opt => {
      return opt.name.toLowerCase().includes(q) ||
             opt.description.toLowerCase().includes(q) ||
             opt.primaryModule.toLowerCase().includes(q) ||
             opt.targetAddress.toLowerCase().includes(q) ||
             (opt.group && opt.group.toLowerCase().includes(q));
    });
  }

  it('should filter options by name', () => {
    const results = filterOptions('Horn', optionsList);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('f150_double_horn_honk');
  });

  it('should filter options by description', () => {
    const results = filterOptions('synthetic engine', optionsList);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('f150_disable_ese_engine_sound');
  });

  it('should filter options by target address', () => {
    const results = filterOptions('706-01-01', optionsList);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('f150_enable_lane_change_assist');
  });

  it('should filter options by module identifier', () => {
    const results = filterOptions('727', optionsList);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('f150_disable_ese_engine_sound');
  });

  it('should filter options by group name', () => {
    const results = filterOptions('BlueCruise', optionsList);
    expect(results.length).toBe(1);
    expect(results[0].id).toBe('f150_enable_lane_change_assist');
  });
});
