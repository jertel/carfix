import { describe, it, expect } from 'vitest';
import { ModuleRegistry } from '../../src/core/registry/moduleRegistry';
import { fordF150Gen14Module } from '../../src/modules/ford-f150-gen14';

describe('ModuleRegistry System', () => {
  it('should register and retrieve pluggable modules', () => {
    const registry = new ModuleRegistry();
    registry.registerModule(fordF150Gen14Module);

    expect(registry.listModules().length).toBe(1);
    const retrieved = registry.getModule('ford-f150-gen14');
    expect(retrieved?.name).toContain('2021+ Ford F-150');
  });

  it('should reject duplicate module registrations', () => {
    const registry = new ModuleRegistry();
    registry.registerModule(fordF150Gen14Module);

    expect(() => registry.registerModule(fordF150Gen14Module)).toThrow();
  });
});
