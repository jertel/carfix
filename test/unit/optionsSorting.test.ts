import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useCarFixStore } from '../../src/stores/carfixStore';
import { IVehicleOption } from '../../src/core/types/module';

describe('Vehicle Options Alphabetical Sorting Unit Tests', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
  });

  it('should sort vehicle options alphabetically by display title', () => {
    const mockOptions: IVehicleOption[] = [
      { id: 'f150_turn_signal_tap_5', name: 'Set Turn Signal Tap Count to 5 Flashes', description: '', primaryModule: '724', targetAddress: '724-01-01', safetyLevel: 'LOW' },
      { id: 'f150_double_horn_honk', name: 'Double Horn Honk Removal', description: '', primaryModule: '726', targetAddress: '726-63-02', safetyLevel: 'LOW' },
      { id: 'f150_bambi_mode_fog_high_beam', name: 'Bambi Mode (Fog + High Beam) Enable', description: '', primaryModule: '726', targetAddress: '726-27-01', safetyLevel: 'LOW' }
    ];

    const sorted = [...mockOptions].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }));

    expect(sorted.map(o => o.name)).toEqual([
      'Bambi Mode (Fog + High Beam) Enable',
      'Double Horn Honk Removal',
      'Set Turn Signal Tap Count to 5 Flashes'
    ]);
  });

  it('should sort store availableOptions alphabetically by name', () => {
    const store = useCarFixStore();
    store.isConnected = true;
    store.isVinMatched = true;

    const opts = store.availableOptions;
    expect(opts.length).toBeGreaterThan(0);

    for (let i = 0; i < opts.length - 1; i++) {
      const comp = opts[i].name.localeCompare(opts[i + 1].name, undefined, { numeric: true, sensitivity: 'base' });
      expect(comp).toBeLessThanOrEqual(0);
    }
  });

  it('should dynamically sort top-level items (groups and standalone options) and group sub-options alphabetically', () => {
    const mockOptions: IVehicleOption[] = [
      { id: 'opt_z', name: 'Zebra Option', description: '', primaryModule: '7D0', targetAddress: '7D0-01-01', safetyLevel: 'LOW' },
      { id: 'opt_g_b', name: 'Beta Feature', description: '', primaryModule: '706', targetAddress: '706-01-02', group: 'Alpha Group', safetyLevel: 'LOW' },
      { id: 'opt_g_a', name: 'Alpha Feature', description: '', primaryModule: '706', targetAddress: '706-01-01', group: 'Alpha Group', safetyLevel: 'LOW' },
      { id: 'opt_a', name: 'Apple Option', description: '', primaryModule: '726', targetAddress: '726-01-01', safetyLevel: 'LOW' }
    ];

    const standaloneOpts: any[] = [];
    const groupsMap = new Map<string, IVehicleOption[]>();

    mockOptions.forEach((opt) => {
      const groupName = opt.group || opt.groupName;
      if (groupName) {
        if (!groupsMap.has(groupName)) {
          groupsMap.set(groupName, []);
        }
        groupsMap.get(groupName)!.push(opt);
      } else {
        standaloneOpts.push(opt);
      }
    });

    const groupItems: any[] = [];
    groupsMap.forEach((groupOpts, groupName) => {
      const sortedGroupOpts = [...groupOpts].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
      groupItems.push({
        id: `group_${groupName}`,
        isGroup: true,
        groupName,
        options: sortedGroupOpts
      });
    });

    const getItemTitle = (item: any): string => {
      if (item.isGroup) {
        return item.groupName;
      }
      return item.name;
    };

    const combinedList = [...groupItems, ...standaloneOpts];
    combinedList.sort((a, b) =>
      getItemTitle(a).localeCompare(getItemTitle(b), undefined, { numeric: true, sensitivity: 'base' })
    );

    // Expected order of top level:
    // 1. Alpha Group (Group)
    // 2. Apple Option (Standalone)
    // 3. Zebra Option (Standalone)
    expect(combinedList.map(getItemTitle)).toEqual([
      'Alpha Group',
      'Apple Option',
      'Zebra Option'
    ]);

    // Expected sub-options in Alpha Group:
    // 1. Alpha Feature
    // 2. Beta Feature
    expect(combinedList[0].options.map((o: IVehicleOption) => o.name)).toEqual([
      'Alpha Feature',
      'Beta Feature'
    ]);
  });
});
