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
import { asBuiltAddressToDid, normalizeModuleId, parseObdPayloadBytes } from '../core/utils/hexUtils';
import { udsClient, ISimulatedTransmit, formatRawCommand } from '../core/obd/udsClient';
import { APP_VERSION } from '../core/config/appVersion';


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
    connectionStatusText: '',
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
    showTransmitPreview: false,
    firmwarePrereqMap: {} as Record<string, { satisfied: boolean; missing: string[] }>,
    agreedDisclaimerVersions: [] as string[],
    showDisclaimerModal: false,
    autoConnect: false,
    autoReconnect: false,
    reconnectTimer: null as any
  }),

  getters: {
    isSimulationMode: () => obdBridge.isSimulationMode(),
    isEngineRunning: (state): boolean => {
      const rpmActive = state.pids
        .filter(p => p.definition.id.includes('rpm') || p.definition.id.includes('motor'))
        .some(p => typeof p.currentValue === 'number' && Math.abs(p.currentValue) > 0);

      const speedActive = state.pids
        .filter(p => p.definition.id.includes('speed'))
        .some(p => typeof p.currentValue === 'number' && p.currentValue > 0);

      const gearActive = state.pids
        .filter(p => p.definition.id.includes('gear'))
        .some(p => typeof p.currentValue === 'number' && p.currentValue > 0);

      return rpmActive || speedActive || gearActive;
    },
    activeModule: (state) => moduleRegistry.getModule(state.activeModuleId),
    availableOptions: (state) => {
      if (!state.isConnected || !state.isVinMatched) {
        return [];
      }
      const mod = moduleRegistry.getModule(state.activeModuleId);
      if (!mod) return [];
      return [...mod.optionsCatalog].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' })
      );
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

    async toggleCompactDashboardMode() {
      this.isCompactDashboardMode = !this.isCompactDashboardMode;
      await preferencesManager.saveCompactDashboardModePref(this.isCompactDashboardMode);
    },

    async setCompactDashboardMode(enabled: boolean) {
      this.isCompactDashboardMode = enabled;
      await preferencesManager.saveCompactDashboardModePref(enabled);
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
        let scanned: IVehicleModuleInfo[] = [];
        if (this.activeModule && this.activeModule.scanModuleVersions) {
          scanned = await this.activeModule.scanModuleVersions();
        } else {
          scanned = [
            { id: '7E0', name: 'Engine Control Module (ECM / PCM)', category: 'POWERTRAIN', partNumberDid: 'Mode 09', currentVersion: 'SAE-J1979-MODE09', status: 'OK' }
          ];
        }

        for (const mod of scanned) {
          const versionStr = mod.softwareVersion || mod.partNumber || mod.currentVersion;
          if (versionStr) {
            const res = await preferencesManager.recordModuleVersion(mod.id, versionStr);
            mod.history = res.history;
            mod.firstDetectedISO = res.firstDetectedISO;
            mod.versionChanged24h = res.versionChanged24h;
          }
        }

        this.detectedModules = scanned;
        await this.evaluateOptionFirmwarePrerequisites();
      } finally {
        this.isScanningModules = false;
      }
    },

    async evaluateOptionFirmwarePrerequisites() {
      if (!this.activeModule || !this.activeModule.checkFirmwarePrerequisites) {
        this.firmwarePrereqMap = {};
        return;
      }
      const map: Record<string, { satisfied: boolean; missing: string[] }> = {};
      for (const opt of this.availableOptions) {
        if (opt.firmwareRequirements && opt.firmwareRequirements.length > 0) {
          const res = await this.activeModule.checkFirmwarePrerequisites(opt);
          map[opt.id] = res;
        } else {
          map[opt.id] = { satisfied: true, missing: [] };
        }
      }
      this.firmwarePrereqMap = map;
    },

    isOptionFirmwareSatisfied(option: IVehicleOption): boolean {
      if (!option || !option.firmwareRequirements || option.firmwareRequirements.length === 0) {
        return true;
      }
      const entry = this.firmwarePrereqMap[option.id];
      return entry ? entry.satisfied : true;
    },

    getOptionFirmwareMissingReason(option: IVehicleOption): string {
      if (!option || !option.firmwareRequirements) return '';
      const entry = this.firmwarePrereqMap[option.id];
      if (entry && !entry.satisfied) {
        return entry.missing.join('; ');
      }
      return '';
    },

    async checkDisclaimerAgreement() {
      const versions = await preferencesManager.loadAgreedDisclaimerVersions();
      this.agreedDisclaimerVersions = versions;
      this.showDisclaimerModal = !versions.includes(APP_VERSION);
    },

    async acceptDisclaimer(version: string = APP_VERSION) {
      await preferencesManager.saveAgreedDisclaimerVersion(version);
      if (!this.agreedDisclaimerVersions.includes(version)) {
        this.agreedDisclaimerVersions.push(version);
      }
      this.showDisclaimerModal = false;
      this.addLog('INF', `User agreed to disclaimer version ${version}`);
    },

    async initializeDashboard() {
      this.setupObdLogging();
      this.isDebugLoggingEnabled = await preferencesManager.loadDebugLoggingPref();
      this.isCompactDashboardMode = await preferencesManager.loadCompactDashboardModePref();
      this.telemetryRate = await preferencesManager.loadTelemetryRatePref();
      this.autoConnect = await preferencesManager.loadAutoConnectPref();
      this.autoReconnect = await preferencesManager.loadAutoReconnectPref();
      await backupManager.loadPersistedLineHistory();
      await this.checkDisclaimerAgreement();

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
      this.connectionStatusText = 'Connecting to OBD adapter...';
      this.addLog('INF', 'Initiating OBD connection phase...');

      const targetAddress = this.selectedDeviceAddress || (obdBridge.isSimulationMode() ? 'DEMO_MODE' : '');
      if (!targetAddress) {
        this.isConnecting = false;
        this.connectionStatusText = '';
        throw new Error('Please select an OBDII Bluetooth adapter from the list.');
      }

      const isDemo = targetAddress === 'DEMO_MODE';
      obdBridge.setSimulationMode(isDemo);

      const selected = this.pairedDevices.find(d => d.address === targetAddress);
      const adapterName = isDemo
        ? 'Demo Mode (Simulated Adapter)'
        : (selected ? selected.name : `OBD Adapter (${targetAddress})`);

      try {
        this.connectionStatusText = 'Connecting to OBD adapter...';
        this.addLog('INF', `Opening connection to ${adapterName} [${isDemo ? 'DEMO' : 'HARDWARE'}]...`);
        await obdBridge.connect({
          adapterName: adapterName,
          connectionType: 'BLUETOOTH_CLASSIC',
          macOrUuid: targetAddress
        });

        await preferencesManager.saveLastDeviceAddress(targetAddress);

        this.isConnected = true;
        this.activeAdapter = adapterName;
        this.addLog('INF', `Connected to ${adapterName} [${isDemo ? 'DEMO' : 'HARDWARE'}]`);

        this.connectionStatusText = 'Querying vehicle VIN (Mode 09 / UDS F190)...';
        this.addLog('INF', 'Querying vehicle VIN (Mode 09 / UDS F190)...');
        const detectedVin = await this.readVehicleVin();
        this.connectedVin = detectedVin;
        if (detectedVin) {
          this.addLog('INF', `Vehicle VIN detected: ${detectedVin}`);
        } else {
          this.addLog('WRN', 'No VIN returned from vehicle');
        }

        this.connectionStatusText = 'Matching vehicle profile...';
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
          this.connectionStatusText = 'Scanning vehicle ECU software modules...';
          this.addLog('INF', 'Scanning vehicle ECU module software versions...');
          await this.scanVehicleModules();

          this.connectionStatusText = 'Querying Diagnostic Trouble Codes (DTCs)...';
          this.addLog('INF', 'Querying Diagnostic Trouble Codes (DTCs)...');
          await this.scanDtcCodes();
        }

        this.connectionStatusText = 'Initializing live telemetry polling...';
        this.addLog('INF', 'Starting telemetry polling & engine state check...');
        this.startTelemetryPolling();
        await this.checkEngineRunningLive();
        this.clearReconnectTimer();

        this.addLog('INF', 'Connection phase complete.');
      } catch (err: any) {
        this.isConnected = false;
        this.addLog('ERR', `Failed to connect: ${err?.message || err}`);
        this.stopTelemetryPolling();
        throw err;
      } finally {
        this.isConnecting = false;
        this.connectionStatusText = '';
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
        if (this.autoReconnect) {
          this.startReconnectTimer();
        }
      } else {
        this.clearReconnectTimer();
        this.addLog('INF', 'User disconnected');
      }
    },

    clearReconnectTimer() {
      if (this.reconnectTimer !== null) {
        clearInterval(this.reconnectTimer);
        this.reconnectTimer = null;
      }
    },

    startReconnectTimer() {
      this.clearReconnectTimer();
      this.addLog('INF', 'Auto-reconnect active — retrying every 60s');
      this.reconnectTimer = setInterval(async () => {
        if (this.isConnected || this.isConnecting) return;
        this.addLog('INF', 'Auto-reconnect: attempting to connect...');
        try {
          await this.connectAdapter();
        } catch {
          // next attempt in 60s
        }
      }, 60000);
    },

    async setAutoConnect(enabled: boolean) {
      this.autoConnect = enabled;
      await preferencesManager.saveAutoConnectPref(enabled);
    },

    async setAutoReconnect(enabled: boolean) {
      this.autoReconnect = enabled;
      await preferencesManager.saveAutoReconnectPref(enabled);
      if (!enabled) {
        this.clearReconnectTimer();
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

    async setTelemetryRate(rate: number) {
      this.telemetryRate = rate;
      await preferencesManager.saveTelemetryRatePref(rate);
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
    },

    async checkEngineRunningLive(): Promise<boolean> {
      if (!this.isConnected) return false;
      if (obdBridge.isSimulationMode()) {
        return this.isEngineRunning;
      }

      try {
        await obdBridge.setHeader('7DF');

        // 1. Query PID 010C (Engine RPM)
        const rawRpm = await obdBridge.sendCommand('010C', 800);
        if (rawRpm && !/NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawRpm)) {
          const bytes = parseObdPayloadBytes(rawRpm);
          if (bytes.length >= 2) {
            const rpm = Math.round(((bytes[0] * 256) + bytes[1]) / 4);
            const rpmPid = this.pids.find(p => p.definition.id.includes('rpm'));
            if (rpmPid) {
              rpmPid.currentValue = rpm;
            }
            if (rpm > 0) return true;
          }
        }

        // 2. Query PID 010D (Vehicle Speed)
        const rawSpeed = await obdBridge.sendCommand('010D', 800);
        if (rawSpeed && !/NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawSpeed)) {
          const bytes = parseObdPayloadBytes(rawSpeed);
          if (bytes.length >= 1) {
            const speed = Math.round(bytes[0] * 0.621371);
            const speedPid = this.pids.find(p => p.definition.id.includes('speed'));
            if (speedPid) {
              speedPid.currentValue = speed;
            }
            if (speed > 0) return true;
          }
        }

        // 3. Query PID 01A4 (Transmission Actual Gear / Park status)
        const rawGear = await obdBridge.sendCommand('01A4', 800);
        if (rawGear && !/NO DATA|ERROR|UNABLE|STOPPED|CAN ERROR/i.test(rawGear)) {
          const bytes = parseObdPayloadBytes(rawGear);
          if (bytes.length >= 1) {
            const gear = bytes[0];
            const gearPid = this.pids.find(p => p.definition.id.includes('gear'));
            if (gearPid) {
              gearPid.currentValue = gear;
            }
            if (gear > 0) return true;
          }
        }
      } catch (err: any) {
        this.addLog('WRN', `Live vehicle status check error: ${err?.message || err}`);
      }

      return this.isEngineRunning;
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
      const running = await this.checkEngineRunningLive();
      if (running) {
        this.optionLoadingMap[option.id] = false;
        this.addLog('ERR', `Cannot read option line ${option.targetAddress}: Engine is running.`);
        return;
      }
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

    async requestOptionsRefresh(target?: IVehicleOption) {
      if (!this.isConnected || !this.isVinMatched) return;
      const running = await this.checkEngineRunningLive();
      if (running) {
        this.addLog('WRN', 'Cannot enter Extended Diagnostic mode: Engine is running.');
        return;
      }
      if (target) {
        this.pendingOptionToRead = target;
        this.showExtDiagPrompt = true;
      }
    },

    async confirmOptionsRefresh() {
      const running = await this.checkEngineRunningLive();
      if (running) {
        this.showExtDiagPrompt = false;
        this.pendingOptionToRead = null;
        this.addLog('ERR', 'Cannot enter Extended Diagnostic Session: Engine is running.');
        return;
      }
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
      if (!this.isOptionFirmwareSatisfied(option)) {
        const reason = this.getOptionFirmwareMissingReason(option);
        this.lastWriteResult = {
          success: false,
          address: option.targetAddress,
          previousHex: '',
          newHex: '',
          verifiedHex: '',
          error: `Cannot toggle setting: ${reason || 'Unmet firmware prerequisite'}`,
          timestampISO: new Date().toISOString()
        };
        this.addLog('ERR', `Write blocked for ${option.targetAddress}: Unmet firmware prerequisite.`);
        return;
      }
      const running = await this.checkEngineRunningLive();
      if (running) {
        this.lastWriteResult = {
          success: false,
          address: option.targetAddress,
          previousHex: '',
          newHex: '',
          verifiedHex: '',
          error: 'Cannot write parameter: Engine is running. Turn off engine (Ignition ON, Engine OFF).',
          timestampISO: new Date().toISOString()
        };
        this.addLog('ERR', `Write blocked for ${option.targetAddress}: Engine is running.`);
        return;
      }
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
      const running = await this.checkEngineRunningLive();
      if (running) {
        this.lastWriteResult = {
          success: false,
          address: option.targetAddress,
          previousHex: '',
          newHex: '',
          verifiedHex: '',
          error: 'Cannot restore parameter: Engine is running. Turn off engine (Ignition ON, Engine OFF).',
          timestampISO: new Date().toISOString()
        };
        this.addLog('ERR', `Restore blocked for ${option.targetAddress}: Engine is running.`);
        return false;
      }
      const wasPolling = this.isPolling;
      if (wasPolling) {
        this.stopTelemetryPolling();
      }
      this.isWriting = true;
      try {
        const result = await (this.activeModule as any).writeOption(option, false, targetHex);
        this.lastWriteResult = result;
        if (result.success) {
          this.moduleData[option.targetAddress] = result.verifiedHex || targetHex;
          this.addLog('INF', `Restored line ${option.targetAddress} to ${targetHex}`);
          return true;
        } else {
          this.addLog('ERR', `Failed to restore line ${option.targetAddress}: ${result.error || 'ECU rejection'}`);
          return false;
        }
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
