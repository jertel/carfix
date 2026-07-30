import { IVehicleModule } from '../types/module';

/**
 * Pluggable Vehicle Module Registry for CarFix
 */
export class ModuleRegistry {
  private modules: Map<string, IVehicleModule> = new Map();

  public registerModule(module: IVehicleModule): void {
    if (this.modules.has(module.id)) {
      throw new Error(`Module with ID '${module.id}' is already registered.`);
    }
    this.modules.set(module.id, module);
  }

  public getModule(id: string): IVehicleModule | undefined {
    return this.modules.get(id);
  }

  public findModuleForVin(vin: string): IVehicleModule | undefined {
    const cleanVin = vin.toUpperCase().replace(/[^A-Z0-9]/g, '');
    for (const mod of this.modules.values()) {
      if (mod.matchesVin(cleanVin)) {
        return mod;
      }
    }
    return undefined;
  }

  public listModules(): IVehicleModule[] {
    return Array.from(this.modules.values());
  }

  public clear(): void {
    this.modules.clear();
  }
}

export const moduleRegistry = new ModuleRegistry();
