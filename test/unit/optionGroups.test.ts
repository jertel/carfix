import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { backupManager } from '../../src/core/safety/backupManager';
import { IVehicleOption } from '../../src/core/types/module';

describe('Option Groups Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  const blueCruiseOption1: IVehicleOption = {
    id: 'f150_enable_lane_change_assist',
    name: 'Enable Lane Change Assist (IPMA)',
    description: 'Enables lane change assist.',
    category: 'DRIVER_ASSIST',
    primaryModule: '706',
    targetAddress: '706-01-01',
    mask: 'xExx xxxx xx--',
    group: 'BlueCruise 1.4',
    safetyLevel: 'HIGH'
  };

  const blueCruiseOption2: IVehicleOption = {
    id: 'f150_enable_in_lane_repositioning',
    name: 'Enable In-Lane Repositioning',
    description: 'Positions vehicle away from semi-trucks.',
    category: 'DRIVER_ASSIST',
    primaryModule: '706',
    targetAddress: '706-02-02',
    mask: 'xxxx xxxx x2--',
    group: 'BlueCruise 1.4',
    safetyLevel: 'HIGH'
  };

  const standaloneOption: IVehicleOption = {
    id: 'f150_double_horn_honk',
    name: 'Double Horn Honk Removal',
    description: 'Prevents double horn honk.',
    category: 'CONVENIENCE',
    primaryModule: '726',
    targetAddress: '726-63-02',
    mask: 'xxx0 xxxx xx--',
    safetyLevel: 'LOW'
  };

  it('should categorize options into groups and sort options alphabetically within group', () => {
    const availableOptions: IVehicleOption[] = [
      standaloneOption,
      blueCruiseOption2,
      blueCruiseOption1
    ];

    const standalone: IVehicleOption[] = [];
    const groupMap = new Map<string, IVehicleOption[]>();

    for (const opt of availableOptions) {
      if (opt.group) {
        const list = groupMap.get(opt.group) || [];
        list.push(opt);
        groupMap.set(opt.group, list);
      } else {
        standalone.push(opt);
      }
    }

    expect(groupMap.has('BlueCruise 1.4')).toBe(true);
    const blueCruiseList = groupMap.get('BlueCruise 1.4')!;
    expect(blueCruiseList.length).toBe(2);

    // Sorted within group alphabetically
    const sortedGroup = [...blueCruiseList].sort((a, b) => a.name.localeCompare(b.name));
    expect(sortedGroup[0].name).toBe('Enable In-Lane Repositioning');
    expect(sortedGroup[1].name).toBe('Enable Lane Change Assist (IPMA)');
  });

  it('should return SOME for group history state when some options modified and ALL when all modified', () => {
    const groupOptions = [blueCruiseOption1, blueCruiseOption2];

    const getGroupHistoryState = (opts: IVehicleOption[]) => {
      const modifiedCount = opts.filter(o => backupManager.getLineHistory(o.targetAddress).length > 0).length;
      if (modifiedCount === opts.length && opts.length > 0) return 'ALL';
      if (modifiedCount > 0) return 'SOME';
      return 'NONE';
    };

    expect(getGroupHistoryState(groupOptions)).toBe('NONE');

    // Modify option 1
    backupManager.recordLineBackup(blueCruiseOption1.targetAddress, '706-01-01 0000 0000 0000');
    expect(getGroupHistoryState(groupOptions)).toBe('SOME');

    // Modify option 2
    backupManager.recordLineBackup(blueCruiseOption2.targetAddress, '706-02-02 0000 0000 0000');
    expect(getGroupHistoryState(groupOptions)).toBe('ALL');
  });

  it('should support both opt.group and opt.groupName properties for grouping', () => {
    const optWithGroup: any = { id: 'o1', name: 'Opt 1', group: 'Group A' };
    const optWithGroupName: any = { id: 'o2', name: 'Opt 2', groupName: 'Group A' };

    const getGroup = (opt: any) => opt.group || opt.groupName;

    expect(getGroup(optWithGroup)).toBe('Group A');
    expect(getGroup(optWithGroupName)).toBe('Group A');
  });
});
