import { defineStore } from 'pinia';
import { fordF150Gen14Module } from '../modules/ford-f150-gen14';
import { moduleRegistry } from '../core/registry/moduleRegistry';
import { backupManager } from '../core/safety/backupManager';
import { IVehicleOption, IVehicleModuleInfo, IWriteResult } from '../core/types/module';
import { isOptionEnabled } from '../core/utils/optionEvaluator';
import { PID_CATALOG } from '../core/pid/pidCatalog';
import { SAE_PID_CATALOG } from '../core/pid/saePidCatalog';
import { IPidDefinition, IPidState, PidViewMode } from '../core/pid/pidTypes';
import { preferencesManager, IPidPreferenceItem } from '../core/storage/preferencesManager';
import { obdBridge, parseVinResponseHex } from '../core/obd/obdBridge';
import { IDtcCode, parseDtcResponseHex } from '../core/obd/dtcDecoder';
import { asBuiltAddressToDid, normalizeModuleId } from '../core/utils/hexUtils';
import { udsClient, ISimulatedTransmit, formatRawCommand } from '../core/obd/udsClient';

export interface ILogEntry {
  id: string;
  timestampISO: string;
  level: 'INF' | 'WRN' | 'ERR';
  message: string;
}

moduleRegistry.registerModule(fordF150Gen14Module);

export const useCarFixStore = defineStore('carfix', {
  state: () => ({
    activeTab: 'connect' as 'connect' | 'pids' | 'options' | 'modules',
    isConnecting: false,
    isConnected: false,
    activeAdapter: '',
    selectedDeviceAddress: '',
    pairedDevices: [] as Array<{ name: string; address: string }>,
    activeModuleId: 'ford-f150-gen14',
    connectedVin: '',
    isVinMatched: false,
    moduleData: {} as Record<string, string>,
    isWriting: false,
    lastWriteResult: null as IWriteResult | null,
    optionLoadingMap: {} as Record<string, boolean>,
    isDebugLoggingEnabled: false,

    isCompactDashboardMode: false,
    isPidChooserOpen: false,
    isScanningModules: false,
    detectedModules: [] as IVehicleModuleInfo[],

    isScanningDtcs: false,
    activeDtcs: [] as IDtcCode[],

    logs: [] as ILogEntry[],

    pids: PID_CATALOG.map((def, index) => ({
      definition: def,
      currentValue: def.minValue,
      history: [],
      viewMode: 'READOUT' as PidViewMode,
      orderIndex: index
    })) as IPidState[],

    isPolling: false,
    pollTimer: null as any,
    telemetryRate: 1, // in seconds, 0 = manual
    showExtDiagPrompt: false,
    hasConfirmedExtDiag: false,
    pendingOptionToRead: null as IVehicleOption | null,
    lastSimulatedTransmit: null as ISimulatedTransmit | null,
    showTransmitPreview: false
  }),

  getters: {
    isSimulationMode: () => obdBridge.isSimulationMode(),
    isEngineRunning: (state): boolean => {
      const rpmPid = state.pids.find(p => p.definition.id.includes('rpm'));
      return !!(rpmPid && typeof rpmPid.currentValue === 'number' && rpmPid.currentValue > 0);
    },
    activeModule: (state) => moduleRegistry.getModule(state.activeModuleId),
    availableOptions: (state) => {
      if (!state.isConnected || !state.isVinMatched) {
        return [];
      }
      const mod = moduleRegistry.getModule(state.activeModuleId);
      return mod ? mod.optionsCatalog : [];
    },
    availablePids: (state): IPidDefinition[] => {
      const mod = moduleRegistry.getModule(state.activeModuleId);
      const modulePids = mod?.pidCatalog || [];
      const map = new Map<string, IPidDefinition>();
      SAE_PID_CATALOG.forEach(p => map.set(p.id, p));
      modulePids.forEach(p => map.set(p.id, p));
      return Array.from(map.values());
    },
    getOptionState: (state) => (option: IVehicleOption): boolean => {
      if (!state.isConnected || !state.isVinMatched || !state.moduleData[option.targetAddress]) {
        return false;
      }
      const hexLine = state.moduleData[option.targetAddress];
      return isOptionEnabled(option, hexLine);
    },
    sortedPids: (state) => {
      return [...state.pids].sort((a, b) => a.orderIndex - b.orderIndex);
    }
  },

  actions: {
    addLog(level: 'INF' | 'WRN' | 'ERR', message: string) {
      const entry: ILogEntry = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        timestampISO: new Date().toISOString(),
        level,
        message
      };
      this.logs.push(entry);
      if (this.logs.length > 50000) {
        this.logs.shift();
      }
    },

    setupObdLogging() {
      obdBridge.onCommandLogged = (dir, payload) => {
        if (this.isDebugLoggingEnabled) {
          this.addLog('INF', `${dir}: ${payload}`);
        }
      };
    },

    async setDebugLogging(enabled: boolean) {
      this.isDebugLoggingEnabled = enabled;
      await preferencesManager.saveDebugLoggingPref(enabled);
      this.addLog('INF', `Debug mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    },

    async toggleDebugLogging() {
      await this.setDebugLogging(!this.isDebugLoggingEnabled);
    },

    clearLogs() {
      this.logs = [];
    },

    nextTab() {
      const tabs: Array<'connect' | 'pids' | 'modules' | 'options'> = ['connect', 'pids', 'modules', 'options'];
      const idx = tabs.indexOf(this.activeTab);
      if (idx !== -1 && idx < tabs.length - 1) {
        this.activeTab = tabs[idx + 1];
      }
    },

    prevTab() {
      const tabs: Array<'connect' | 'pids' | 'modules' | 'options'> = ['connect', 'pids', 'modules', 'options'];
      const idx = tabs.indexOf(this.activeTab);
      if (idx > 0) {
        this.activeTab = tabs[idx - 1];
      }
    },

    toggleCompactDashboardMode() {
      this.isCompactDashboardMode = !this.isCompactDashboardMode;
    },

    openPidChooser() {
      this.isPidChooserOpen = true;
    },

    closePidChooser() {
      this.isPidChooserOpen = false;
    },

    async fetchPairedDevices() {
      const devices = await obdBridge.getPairedDevices();
      const demoOption = { name: 'Demo Mode (Simulated Adapter)', address: 'DEMO_MODE' };
      const hasDemo = devices.some(d => d.address === 'DEMO_MODE');
      const allDevices = hasDemo ? devices : [...devices, demoOption];
      this.pairedDevices = allDevices;

      const savedAddress = await preferencesManager.loadLastDeviceAddress();
      if (savedAddress && allDevices.some(d => d.address === savedAddress)) {
        const matched = allDevices.find(d => d.address === savedAddress);
        this.selectedDeviceAddress = savedAddress;
        if (matched) {
          this.activeAdapter = matched.name;
        }
      } else if (!this.selectedDeviceAddress && allDevices.length > 0) {
        this.selectedDeviceAddress = allDevices[0].address;
        this.activeAdapter = allDevices[0].name;
      }
    },

    async setSelectedDeviceAddress(address: string) {
      this.selectedDeviceAddress = address;
      const matched = this.pairedDevices.find(d => d.address === address);
      if (matched) {
        this.activeAdapter = matched.name;
      }
      await preferencesManager.saveLastDeviceAddress(address);
    },

    async readVehicleVin(): Promise<string> {
      try {
        await obdBridge.setHeader('7DF');
        const rawVin = await obdBridge.sendCommand('0902', 1500);
        let parsedVin = parseVinResponseHex(rawVin);
        if (parsedVin && parsedVin.length === 17) {
          return parsedVin;
        }

        // Fallback: Query UDS VIN DID F190 on PCM (7E0) or BCM (726)
        await obdBridge.setHeader('7E0');
        const rawVinUds = await obdBridge.sendCommand('22F190', 1500);
        parsedVin = parseVinResponseHex(rawVinUds);
        if (parsedVin && parsedVin.length === 17) {
          return parsedVin;
        }
      } catch (e) {
        // Fallback for simulation
      }
      return obdBridge.isSimulationMode() ? '1FTFW1ED4MF123456' : '';
    },

    async scanDtcCodes() {
      this.isScanningDtcs = true;
      try {
        if (this.isConnected && !obdBridge.isSimulationMode()) {
          // Read Mode 03 (Stored), Mode 07 (Pending), and Mode 0A (Permanent) DTCs
          const resStored = await obdBridge.sendCommand('03', 1500);
          const resPending = await obdBridge.sendCommand('07', 1500);
          const resPermanent = await obdBridge.sendCommand('0A', 1500);

          const dtcList: IDtcCode[] = [
            ...parseDtcResponseHex(resStored, 'STORED'),
            ...parseDtcResponseHex(resPending, 'PENDING'),
            ...parseDtcResponseHex(resPermanent, 'PERMANENT')
          ];

          this.activeDtcs = dtcList;
        } else if (this.isConnected && obdBridge.isSimulationMode()) {
          // Simulation Mode active DTCs
          this.activeDtcs = [
            { code: 'P0128', status: 'STORED', description: 'Coolant Thermostat Temperature Below Regulating Temperature', category: 'POWERTRAIN' },
            { code: 'U0140', status: 'PENDING', description: 'Lost Communication with Body Control Module', category: 'NETWORK' }
          ];
        } else {
          this.activeDtcs = [];
        }
      } finally {
        this.isScanningDtcs = false;
      }
    },

    async clearDtcCodes() {
      if (this.isConnected && !obdBridge.isSimulationMode()) {
        await obdBridge.sendCommand('04', 2000);
      }
      this.activeDtcs = [];
    },

    async scanVehicleModules() {
      this.isScanningModules = true;
      try {
        if (this.activeModule && this.activeModule.scanModuleVersions) {
          this.detectedModules = await this.activeModule.scanModuleVersions();
        } else {
          this.detectedModules = [
            { id: '7E0', name: 'Engine Control Module (ECM / PCM)', category: 'POWERTRAIN', partNumberDid: 'Mode 09', currentVersion: 'SAE-J1979-MODE09', status: 'OK' }
          ];
        }
      } finally {
        this.isScanningModules = false;
      }
    },

    async initializeDashboard() {
      this.setupObdLogging();
      this.isDebugLoggingEnabled = await preferencesManager.loadDebugLoggingPref();
      await backupManager.loadPersistedLineHistory();

      await this.fetchPairedDevices();
      const savedPreferences = await preferencesManager.loadDashboardPreferences();

      if (savedPreferences.length > 0) {
        const activePidStates: IPidState[] = [];

        savedPreferences.forEach((pref: IPidPreferenceItem, index: number) => {
          const def = this.availablePids.find(p => p.id === pref.id);
          if (def) {
            activePidStates.push({
              definition: def,
              currentValue: def.minValue,
              history: [],
              viewMode: pref.viewMode || 'READOUT',
              orderIndex: index
            });
          }
        });

        if (activePidStates.length > 0) {
          this.pids = activePidStates;
        }
      }
    },

    async saveDashboardPreferences() {
      const prefItems: IPidPreferenceItem[] = this.sortedPids.map(p => ({
        id: p.definition.id,
        viewMode: p.viewMode
      }));
      await preferencesManager.saveDashboardPreferences(prefItems);
    },

    async probePidAvailability(pid: IPidState): Promise<boolean> {
      if (obdBridge.isSimulationMode()) {
        pid.isAvailable = true;
        return true;
      }
      try {
        const targetHeader = pid.definition.header || '7DF';
        await obdBridge.setHeader(targetHeader);
        if (!this.isConnected) return false;

        const rawResponse = await obdBridge.sendCommand(pid.definition.command, 1000);
        if (!this.isConnected) return false;

        if (!rawResponse || /NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawResponse)) {
          pid.isAvailable = false;
          return false;
        }

        pid.definition.decoder(rawResponse);
        pid.isAvailable = true;
        return true;
      } catch (e) {
        pid.isAvailable = false;
        return false;
      }
    },

    async performPidBaselineCheck() {
      for (const pid of this.pids) {
        if (!this.isConnected) break;
        if (pid.isAvailable === undefined) {
          const available = await this.probePidAvailability(pid);
          if (!available && this.isConnected) {
            this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
          }
        }
      }
    },

    async addPidToDashboard(pidId: string) {
      if (this.pids.some(p => p.definition.id === pidId)) return;

      const def = this.availablePids.find(p => p.id === pidId);
      if (!def) return;

      const newPidState: IPidState = {
        definition: def,
        currentValue: def.minValue,
        history: [],
        viewMode: 'READOUT',
        orderIndex: this.pids.length
      };

      if (this.isConnected) {
        const available = await this.probePidAvailability(newPidState);
        if (!available && this.isConnected) {
          this.addLog('ERR', `Failed to read PID ${newPidState.definition.id}`);
        }
      }

      this.pids.push(newPidState);
      await this.saveDashboardPreferences();
    },

    async removePidFromDashboard(pidId: string) {
      this.pids = this.pids.filter(p => p.definition.id !== pidId);
      await this.saveDashboardPreferences();
    },

    async connectAdapter() {
      if (this.isConnecting) return;
      this.isConnecting = true;
      this.addLog('INF', 'Connecting');

      const targetAddress = this.selectedDeviceAddress || (obdBridge.isSimulationMode() ? 'DEMO_MODE' : '');
      if (!targetAddress) {
        this.isConnecting = false;
        throw new Error('Please select an OBDII Bluetooth adapter from the list.');
      }

      const isDemo = targetAddress === 'DEMO_MODE';
      obdBridge.setSimulationMode(isDemo);

      const selected = this.pairedDevices.find(d => d.address === targetAddress);
      const adapterName = isDemo
        ? 'Demo Mode (Simulated Adapter)'
        : (selected ? selected.name : `OBD Adapter (${targetAddress})`);

      try {
        await obdBridge.connect({
          adapterName: adapterName,
          connectionType: 'BLUETOOTH_CLASSIC',
          macOrUuid: targetAddress
        });

        await preferencesManager.saveLastDeviceAddress(targetAddress);

        this.isConnected = true;
        this.activeAdapter = adapterName;
        this.addLog('INF', `Connected to ${adapterName} [${isDemo ? 'DEMO' : 'HARDWARE'}]`);

        const detectedVin = await this.readVehicleVin();
        this.connectedVin = detectedVin;
        if (detectedVin) {
          this.addLog('INF', `Read VIN ${detectedVin}`);
        }

        const matchedModule = detectedVin ? moduleRegistry.findModuleForVin(detectedVin) : null;
        if (matchedModule) {
          this.activeModuleId = matchedModule.id;
          this.isVinMatched = true;
          this.addLog('INF', `Matched vehicle profile ${matchedModule.name}`);
        } else {
          this.isVinMatched = false;
          if (detectedVin) {
            this.addLog('WRN', 'No matching vehicle profile for VIN');
          }
        }

        if (this.activeModule && this.isVinMatched) {
          await this.scanVehicleModules();
          await this.scanDtcCodes();
        }

        this.activeTab = 'pids';
        this.startTelemetryPolling();
      } catch (err: any) {
        this.isConnected = false;
        this.addLog('ERR', `Failed to connect: ${err?.message || err}`);
        this.stopTelemetryPolling();
        throw err;
      } finally {
        this.isConnecting = false;
      }
    },

    resetModuleData() {
      this.moduleData = {};
      this.detectedModules = [];
      this.isVinMatched = false;
      this.connectedVin = '';
      this.optionsLoaded = false;
    },

    resetPidData() {
      for (const pid of this.pids) {
        pid.currentValue = pid.definition.minValue;
        pid.history = [];
        delete pid.isAvailable;
      }
    },

    async disconnectAdapter(isUnexpected: boolean = false) {
      this.isConnected = false;
      this.isConnecting = false;
      this.stopTelemetryPolling();
      this.activeAdapter = '';
      this.activeDtcs = [];
      this.resetModuleData();
      this.resetPidData();
      await obdBridge.disconnect();
      obdBridge.setSimulationMode(false);
      if (isUnexpected) {
        this.addLog('WRN', 'Lost connection');
      } else {
        this.addLog('INF', 'User disconnected');
      }
    },

    async pollTelemetryOnce() {
      if (!this.isConnected || this.isWriting) return;
      const wasPolling = this.isPolling;
      this.isPolling = true;
      try {
        for (const pid of this.pids) {
          if (!this.isConnected) break;
          if (pid.isAvailable === false) continue;

          try {
            const targetHeader = pid.definition.header || '7DF';
            await obdBridge.setHeader(targetHeader);
            if (!this.isConnected) break;

            const rawResponse = await obdBridge.sendCommand(pid.definition.command, 1000);
            if (!this.isConnected) break;

            if (!rawResponse || /NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawResponse)) {
              if (this.isConnected) {
                this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
              }
              continue;
            }
            let val = pid.definition.decoder(rawResponse);

            if (obdBridge.isSimulationMode()) {
              const jitter = (Math.random() - 0.5) * (pid.definition.maxValue * 0.05);
              const base = pid.definition.id.includes('rpm') || pid.definition.id.includes('motor') ? 3400 :
                           pid.definition.id.includes('speed') ? 65 :
                           pid.definition.id.includes('soc') || pid.definition.id.includes('soh') ? 72 :
                           pid.definition.id.includes('current') ? -18.2 :
                           pid.definition.id.includes('voltage') ? (pid.definition.maxValue > 50 ? 384.5 : 14.1) :
                           pid.definition.id.includes('coolant') || pid.definition.id.includes('temp') ? 82 : 50;
              val = Math.round(Math.max(pid.definition.minValue, Math.min(pid.definition.maxValue, base + jitter)) * 10) / 10;
            }

            pid.currentValue = val;
            const nowISO = new Date().toISOString();
            pid.history.push({ timestampISO: nowISO, value: val });

            if (pid.history.length > 30) {
              pid.history.shift();
            }
          } catch (e) {
            if (this.isConnected) {
              this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
            }
          }
        }
      } finally {
        if (!this.pollTimer) {
          this.isPolling = false;
        }
      }
    },

    async startTelemetryPolling() {
      if (this.isPolling) return;
      this.isPolling = true;
      let consecutiveErrorCount = 0;
      const MAX_CONSECUTIVE_ERRORS = 3;

      await this.performPidBaselineCheck();

      if (this.telemetryRate <= 0) {
        return;
      }

      this.pollTimer = setInterval(async () => {
        if (!this.isConnected) {
          this.stopTelemetryPolling();
          return;
        }
        if (this.isWriting) {
          return;
        }

        let cycleSuccess = false;
        for (const pid of this.pids) {
          if (!this.isConnected) break;
          if (pid.isAvailable === false) continue;

          try {
            const targetHeader = pid.definition.header || '7DF';
            await obdBridge.setHeader(targetHeader);
            if (!this.isConnected) break;

            const rawResponse = await obdBridge.sendCommand(pid.definition.command, 1000);
            if (!this.isConnected) break;

            if (!rawResponse || /NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawResponse)) {
              if (this.isConnected) {
                this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
              }
              continue;
            }
            let val = pid.definition.decoder(rawResponse);

            if (obdBridge.isSimulationMode()) {
              const jitter = (Math.random() - 0.5) * (pid.definition.maxValue * 0.05);
              const base = pid.definition.id.includes('rpm') || pid.definition.id.includes('motor') ? 3400 :
                           pid.definition.id.includes('speed') ? 65 :
                           pid.definition.id.includes('soc') || pid.definition.id.includes('soh') ? 72 :
                           pid.definition.id.includes('current') ? -18.2 :
                           pid.definition.id.includes('voltage') ? (pid.definition.maxValue > 50 ? 384.5 : 14.1) :
                           pid.definition.id.includes('coolant') || pid.definition.id.includes('temp') ? 82 : 50;
              val = Math.round(Math.max(pid.definition.minValue, Math.min(pid.definition.maxValue, base + jitter)) * 10) / 10;
            }

            pid.currentValue = val;
            const nowISO = new Date().toISOString();
            pid.history.push({ timestampISO: nowISO, value: val });

            if (pid.history.length > 30) {
              pid.history.shift();
            }
            cycleSuccess = true;
          } catch (e) {
            if (this.isConnected) {
              this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
            }
          }
        }

        if (this.isConnected && this.pids.length > 0 && !cycleSuccess && !obdBridge.isSimulationMode()) {
          consecutiveErrorCount++;
          if (consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS) {
            console.warn('Vehicle OBD connection lost or ignition off. Disconnecting adapter.');
            await this.disconnectAdapter(true);
          }
        } else if (cycleSuccess) {
          consecutiveErrorCount = 0;
        }
      }, Math.max(200, this.telemetryRate * 1000));
    },

    setTelemetryRate(rate: number) {
      this.telemetryRate = rate;
      if (this.isPolling) {
        if (this.pollTimer) {
          clearInterval(this.pollTimer);
          this.pollTimer = null;
        }
        if (rate > 0) {
          let consecutiveErrorCount = 0;
          const MAX_CONSECUTIVE_ERRORS = 3;
          this.pollTimer = setInterval(async () => {
            if (!this.isConnected) {
              this.stopTelemetryPolling();
              return;
            }
            if (this.isWriting) {
              return;
            }

            let cycleSuccess = false;
            for (const pid of this.pids) {
              if (!this.isConnected) break;
              if (pid.isAvailable === false) continue;

              try {
                const targetHeader = pid.definition.header || '7DF';
                await obdBridge.setHeader(targetHeader);
                if (!this.isConnected) break;

                const rawResponse = await obdBridge.sendCommand(pid.definition.command, 1000);
                if (!this.isConnected) break;

                if (!rawResponse || /NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawResponse)) {
                  if (this.isConnected) {
                    this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
                  }
                  continue;
                }
                let val = pid.definition.decoder(rawResponse);

                if (obdBridge.isSimulationMode()) {
                  const jitter = (Math.random() - 0.5) * (pid.definition.maxValue * 0.05);
                  const base = pid.definition.id.includes('rpm') || pid.definition.id.includes('motor') ? 3400 :
                               pid.definition.id.includes('speed') ? 65 :
                               pid.definition.id.includes('soc') || pid.definition.id.includes('soh') ? 72 :
                               pid.definition.id.includes('current') ? -18.2 :
                               pid.definition.id.includes('voltage') ? (pid.definition.maxValue > 50 ? 384.5 : 14.1) :
                               pid.definition.id.includes('coolant') || pid.definition.id.includes('temp') ? 82 : 50;
                  val = Math.round(Math.max(pid.definition.minValue, Math.min(pid.definition.maxValue, base + jitter)) * 10) / 10;
                }

                pid.currentValue = val;
                const nowISO = new Date().toISOString();
                pid.history.push({ timestampISO: nowISO, value: val });

                if (pid.history.length > 30) {
                  pid.history.shift();
                }
                cycleSuccess = true;
              } catch (e) {
                if (this.isConnected) {
                  this.addLog('ERR', `Failed to read PID ${pid.definition.id}`);
                }
              }
            }

            if (this.isConnected && this.pids.length > 0 && !cycleSuccess && !obdBridge.isSimulationMode()) {
              consecutiveErrorCount++;
              if (consecutiveErrorCount >= MAX_CONSECUTIVE_ERRORS) {
                console.warn('Vehicle OBD connection lost or ignition off. Disconnecting adapter.');
                await this.disconnectAdapter(true);
              }
            } else if (cycleSuccess) {
              consecutiveErrorCount = 0;
            }
          }, Math.max(200, rate * 1000));
        }
      }
    },

    stopTelemetryPolling() {
      this.isPolling = false;
      if (this.pollTimer) {
        clearInterval(this.pollTimer);
        this.pollTimer = null;
      }
      this.resetPidData();
    },

    async setPidViewMode(pidId: string, mode: PidViewMode) {
      const target = this.pids.find((p) => p.definition.id === pidId);
      if (target) {
        target.viewMode = mode;
        await this.saveDashboardPreferences();
      }
    },

    async setAllPidViewModes(mode: PidViewMode) {
      this.pids.forEach((p) => (p.viewMode = mode));
      await this.saveDashboardPreferences();
    },

    async insertPidAtTarget(draggedId: string, targetId: string, position: 'before' | 'after' = 'after') {
      if (draggedId === targetId) return;

      const currentSorted = this.sortedPids;
      const draggedIndex = currentSorted.findIndex(p => p.definition.id === draggedId);
      const targetIndex = currentSorted.findIndex(p => p.definition.id === targetId);

      if (draggedIndex === -1 || targetIndex === -1) return;

      const [draggedItem] = currentSorted.splice(draggedIndex, 1);
      const newTargetIndex = currentSorted.findIndex(p => p.definition.id === targetId);
      const insertAt = position === 'before' ? newTargetIndex : newTargetIndex + 1;

      currentSorted.splice(insertAt, 0, draggedItem);

      currentSorted.forEach((item, index) => {
        item.orderIndex = index;
      });

      await this.saveDashboardPreferences();
    },

    async readOptionLine(option: IVehicleOption) {
      if (!this.activeModule || !this.isConnected) return;
      this.optionLoadingMap[option.id] = true;
      const wasPolling = this.isPolling;
      if (wasPolling) {
        this.stopTelemetryPolling();
      }
      try {
        let hexVal = '';
        if (this.activeModule.readOptionLine) {
          hexVal = await this.activeModule.readOptionLine(option.targetAddress, option.primaryModule);
        } else {
          const lines = await this.activeModule.readModuleData(option.primaryModule);
          hexVal = lines[option.targetAddress] || '0000 0000 0000';
        }
        this.moduleData[option.targetAddress] = hexVal;
      } catch (err: any) {
        this.addLog('ERR', `Failed to read line ${option.targetAddress}: ${err?.message || err}`);
      } finally {
        this.optionLoadingMap[option.id] = false;
        if (wasPolling && this.isConnected && !this.showExtDiagPrompt) {
          await this.startTelemetryPolling();
        }
      }
    },

    evaluateOptionState(option: IVehicleOption): boolean {
      if (!option) return false;
      const hex = this.moduleData[option.targetAddress];
      return isOptionEnabled(option, hex);
    },

    requestOptionsRefresh(target?: IVehicleOption) {
      if (!this.isConnected || !this.isVinMatched || this.isEngineRunning) return;
      if (target) {
        this.pendingOptionToRead = target;
        this.showExtDiagPrompt = true;
      }
    },

    async confirmOptionsRefresh() {
      this.showExtDiagPrompt = false;
      this.hasConfirmedExtDiag = true;
      if (this.pendingOptionToRead) {
        const opt = this.pendingOptionToRead;
        this.pendingOptionToRead = null;
        await this.readOptionLine(opt);
      }
    },

    cancelOptionsRefresh() {
      this.showExtDiagPrompt = false;
      this.pendingOptionToRead = null;
    },

    async toggleOption(option: IVehicleOption, enable: boolean) {
      if (!this.activeModule || !this.isVinMatched) return;
      const wasPolling = this.isPolling;
      if (wasPolling) {
        this.stopTelemetryPolling();
      }
      this.isWriting = true;
      try {
        const result = await this.writeOptionWithValidation(option, enable);
        this.lastWriteResult = result;
        if (result.success) {
          this.moduleData[option.targetAddress] = result.verifiedHex;
        }
      } finally {
        this.isWriting = false;
        if (wasPolling && this.isConnected) {
          await this.startTelemetryPolling();
        }
      }
    },

    async restoreOptionLine(option: IVehicleOption, targetHex: string): Promise<boolean> {
      if (!this.activeModule || !this.isVinMatched) return false;
      const wasPolling = this.isPolling;
      if (wasPolling) {
        this.stopTelemetryPolling();
      }
      this.isWriting = true;
      try {
        const targetAddress = option.targetAddress;
        const currentHex = this.moduleData[targetAddress] || '0000 0000 0000';
        // Backup current line before overwriting with historical hex
        backupManager.recordLineBackup(targetAddress, currentHex);

        await obdBridge.setHeader(option.primaryModule);
        const did = asBuiltAddressToDid(targetAddress);
        const cleanPayload = targetHex.replace(/\s+/g, '');
        const rawCommand = `2E${did}${cleanPayload}`;

        this.lastSimulatedTransmit = {
          module: option.primaryModule,
          address: targetAddress,
          didHex: did,
          udsService: '0x2E (WriteDataByIdentifier)',
          rawCommand: rawCommand,
          formattedCommand: formatRawCommand(rawCommand),
          previousHex: currentHex,
          newHex: targetHex,
          timestampISO: new Date().toISOString()
        };

        const writeOk = await udsClient.writeDataByIdentifier(did, targetHex);

        if (!writeOk) {
          this.addLog('ERR', `Failed to restore line ${targetAddress}`);
          return false;
        }

        if (udsClient.isWriteDisabled) {
          this.showTransmitPreview = true;
          this.addLog('INF', `[TROUBLESHOOTING MODE] Suppressed ECU write for line ${targetAddress}. Transmission preview displayed.`);
          return true;
        }

        await udsClient.ecuReset(0x03);
        await udsClient.setDiagnosticSession(0x01);

        // Re-read option line from vehicle ECU to update state and toggle
        await this.readOptionLine(option);
        this.addLog('INF', `Restored line ${targetAddress} to ${targetHex}`);
        return true;
      } catch (err: any) {
        this.addLog('ERR', `Failed to restore line ${option.targetAddress}: ${err?.message || err}`);
        return false;
      } finally {
        this.isWriting = false;
        if (wasPolling && this.isConnected) {
          await this.startTelemetryPolling();
        }
      }
    },

    async writeOptionWithValidation(option: IVehicleOption, enable: boolean): Promise<IWriteResult> {
      if (!this.activeModule) {
        return {
          success: false,
          address: option.targetAddress,
          previousHex: '',
          newHex: '',
          verifiedHex: '',
          error: 'No active module profile loaded',
          timestampISO: new Date().toISOString()
        };
      }
      return await this.activeModule.writeOption(option, enable);
    }
  }
});
