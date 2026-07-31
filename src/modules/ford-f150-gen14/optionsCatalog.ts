import { IVehicleOption } from '../../core/types/module';

/**
 * 2021+ Ford F-150 / F-150 Lightning (Gen 14) Verified Options Catalog
 */
export const F150_GEN14_OPTIONS: IVehicleOption[] = [
  {
    id: 'f150_double_horn_honk',
    name: 'Double Horn Honk Removal',
    description: 'Prevents double horn honk when closing a door with key fob outside and engine running.',
    nameKey: 'options.f150.doubleHornHonk.name',
    descriptionKey: 'options.f150.doubleHornHonk.description',
    category: 'CONVENIENCE',
    primaryModule: '726',
    targetAddress: '726-63-02',
    mask: 'xxx0 xxxx xx--',
    bitValues: [{ 0: 0 }],
    revertMask: 'xxx1 xxxx xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_enable_lane_change_assist',
    name: 'Lane Change Assist (IPMA) Enable',
    description: 'Enables MFCLKS LKAlert+LKAid+LCWA lane change assist features in IPMA module.',
    nameKey: 'options.f150.laneChangeAssist.name',
    descriptionKey: 'options.f150.laneChangeAssist.description',
    category: 'DRIVER_ASSIST',
    primaryModule: '706',
    targetAddress: '706-01-01',
    mask: 'xExx xxxx xx--',
    bitValues: [{ 1: 1, 2: 1, 3: 1 }],
    safetyLevel: 'HIGH',
    group: 'BlueCruise 1.4',
    firmwareRequirements: [
      {
        moduleId: '706',
        partNumberDid: 'F113',
        minVersion: 'RJ6T-14H102-ACJ',
        description: 'IPMA Image Processing Module A Calibration'
      }
    ]
  },
  {
    id: 'f150_enable_in_lane_repositioning',
    name: 'In-Lane Repositioning (FeatureCfg IACCMode) Enable',
    description: 'Positions vehicle away from adjacent semi-trucks within lane (FCIACCM Preview+CurveControl).',
    nameKey: 'options.f150.inLaneRepositioning.name',
    descriptionKey: 'options.f150.inLaneRepositioning.description',
    category: 'DRIVER_ASSIST',
    primaryModule: '706',
    targetAddress: '706-02-02',
    mask: 'xxxx xxxx x2--',
    bitValues: [{ 1: 1 }],
    safetyLevel: 'HIGH',
    group: 'BlueCruise 1.4',
    firmwareRequirements: [
      {
        moduleId: '706',
        partNumberDid: 'F113',
        minVersion: 'RJ6T-14H102-ACJ',
        description: 'IPMA Image Processing Module A Calibration'
      }
    ]
  },
  {
    id: 'f150_bluecruise_lane_biasing_predictive_speed',
    name: 'APIM Lane Biasing & Predictive Speed Assist',
    description: 'Enables Lane Biasing and Predictive Speed Assist under Cruise Control in APIM.',
    nameKey: 'options.f150.laneBiasingPredictiveSpeed.name',
    descriptionKey: 'options.f150.laneBiasingPredictiveSpeed.description',
    category: 'DRIVER_ASSIST',
    primaryModule: '7D0',
    targetAddress: '7D0-09-05',
    mask: 'xxxx xx4x 2x--',
    bitValues: [{ 2: 1 }, { 1: 1 }],
    safetyLevel: 'HIGH',
    group: 'BlueCruise 1.4',
    firmwareRequirements: [
      {
        moduleId: '706',
        partNumberDid: 'F113',
        minVersion: 'RJ6T-14H102-ACJ',
        description: 'IPMA Image Processing Module A Calibration'
      }
    ]
  },
  {
    id: 'f150_bluecruise_apim_lane_change_assist',
    name: 'APIM Lane Change Assist',
    description: 'Enables Lane Change Assist under Cruise Control in APIM.',
    nameKey: 'options.f150.apimLaneChangeAssist.name',
    descriptionKey: 'options.f150.apimLaneChangeAssist.description',
    category: 'DRIVER_ASSIST',
    primaryModule: '7D0',
    targetAddress: '7D0-10-02',
    mask: 'xxxx xxxx 1x--',
    bitValues: [{ 0: 1 }],
    safetyLevel: 'HIGH',
    group: 'BlueCruise 1.4',
    firmwareRequirements: [
      {
        moduleId: '706',
        partNumberDid: 'F113',
        minVersion: 'RJ6T-14H102-ACJ',
        description: 'IPMA Image Processing Module A Calibration'
      }
    ]
  },
  {
    id: 'f150_ipma_module_feature_cfg_alb_alc',
    name: 'IPMA Module Feature Cfg (ALB & ALC)',
    description: 'Enables ModuleFeatureCfg_ALB (MFCALB) & ModuleFeatureCfg_ALC (MFCALC) in IPMA.',
    nameKey: 'options.f150.ipmaModuleFeatureCfgAlbAlc.name',
    descriptionKey: 'options.f150.ipmaModuleFeatureCfgAlbAlc.description',
    category: 'DRIVER_ASSIST',
    primaryModule: '706',
    targetAddress: '706-01-02',
    mask: 'x5xx xxxx xx--',
    bitValues: [{ 0: 1, 2: 1 }],
    safetyLevel: 'HIGH',
    group: 'BlueCruise 1.4',
    firmwareRequirements: [
      {
        moduleId: '706',
        partNumberDid: 'F113',
        minVersion: 'RJ6T-14H102-ACJ',
        description: 'IPMA Image Processing Module A Calibration'
      }
    ]
  },
  {
    id: 'f150_ipma_customer_setting_alb_alc_selected',
    name: 'IPMA Customer Setting ALB & ALC Vehicle Selection',
    description: 'Enables CustomerSetting_ALBSelected_Vehicle (CSALBSV) & CustomerSetting_ALCSelected_Vehicle (CSALCSV) in IPMA.',
    nameKey: 'options.f150.ipmaCustomerSettingAlbAlc.name',
    descriptionKey: 'options.f150.ipmaCustomerSettingAlbAlc.description',
    category: 'DRIVER_ASSIST',
    primaryModule: '706',
    targetAddress: '706-38-01',
    mask: 'x8x8 xxxx xx--',
    bitValues: [{ 3: 1 }, { 3: 1 }],
    safetyLevel: 'HIGH',
    group: 'BlueCruise 1.4',
    firmwareRequirements: [
      {
        moduleId: '706',
        partNumberDid: 'F113',
        minVersion: 'RJ6T-14H102-ACJ',
        description: 'IPMA Image Processing Module A Calibration'
      }
    ]
  },
  {
    id: 'f150_bambi_mode_fog_high_beam',
    name: 'Bambi Mode (Fog + High Beam) Enable',
    description: 'Allows fog lamps to remain illuminated when high beams are toggled on.',
    nameKey: 'options.f150.bambiMode.name',
    descriptionKey: 'options.f150.bambiMode.description',
    category: 'LIGHTING',
    primaryModule: '726',
    targetAddress: '726-39-02',
    mask: 'xxx0 xxxx xx--',
    bitValues: [{ 0: 0 }],
    revertMask: 'xxx1 xxxx xx--',
    safetyLevel: 'MEDIUM'
  },
  {
    id: 'f150_turn_signal_tap_5',
    name: 'Set Turn Signal Tap Count to 5 Flashes',
    description: 'Increases standard lane change tap count from 3 flashes to 5 flashes.',
    nameKey: 'options.f150.turnSignalTap5.name',
    descriptionKey: 'options.f150.turnSignalTap5.description',
    category: 'CONVENIENCE',
    primaryModule: '724',
    targetAddress: '724-01-01',
    mask: 'xxxxxAxxxx--',
    bitValues: [{ 1: 1, 3: 1 }],
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_disable_beltminder_driver',
    name: 'Driver Beltminder Warning Removal',
    description: 'Mutes continuous driver seatbelt chime while driving.',
    nameKey: 'options.f150.beltminderDriver.name',
    descriptionKey: 'options.f150.beltminderDriver.description',
    category: 'SAFETY',
    primaryModule: '720',
    targetAddress: '720-01-01',
    mask: 'xxxx x0xx xx--',
    bitValues: [{ 0: 0 }],
    safetyLevel: 'MEDIUM'
  },
  {
    id: 'f150_disable_ese_engine_sound',
    name: 'Engine Sound Enhancement (ESE) Removal',
    description: 'Mutes simulated synthetic engine noise through cabin speakers.',
    nameKey: 'options.f150.eseEngineSound.name',
    descriptionKey: 'options.f150.eseEngineSound.description',
    category: 'CONVENIENCE',
    primaryModule: '727',
    targetAddress: '727-01-01',
    mask: 'xxxx xxxx 0x--',
    bitValues: [{ 0: 0 }],
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_offroad_screen_cluster',
    name: 'Off-Road Pitch & Roll Screen Enable',
    description: 'Adds off-road pitch, roll, and steering angle gauge screen to instrument cluster.',
    nameKey: 'options.f150.offroadScreen.name',
    descriptionKey: 'options.f150.offroadScreen.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-09-01',
    mask: 'xxxx x1xx xx--',
    bitValues: [{ 0: 1 }],
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_75th_anniversary_splash_screen',
    name: '75th Anniversary Splash Screen Enable',
    description: 'Enables 75th Anniversary boot splash screen on Sync display. Requires Sync version 22012 or higher. Note: APIM reset required.',
    nameKey: 'options.f150.anniversary75SplashScreen.name',
    descriptionKey: 'options.f150.anniversary75SplashScreen.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-03-01',
    mask: 'xxxx 24xx xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_unreal_sync_theme',
    name: 'Unreal Sync Theme Enable',
    description: 'Enables Unreal Engine Sync 4 visual theme on central display.',
    nameKey: 'options.f150.unrealSyncTheme.name',
    descriptionKey: 'options.f150.unrealSyncTheme.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-02-03',
    mask: 'xxxx xxx1 xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_climate_bar_non_hybrid',
    name: 'Climate Bar - Non-Hybrid Enable',
    description: 'Enables climate bar at bottom of Sync screen for non-hybrid models. Requires Unreal Sync Theme.',
    nameKey: 'options.f150.climateBarNonHybrid.name',
    descriptionKey: 'options.f150.climateBarNonHybrid.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-02-02',
    mask: 'xxx2 xxxx xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_climate_bar_hybrid',
    name: 'Climate Bar - Hybrid Enable',
    description: 'Enables climate bar at bottom of Sync screen for hybrid models. Requires Unreal Sync Theme.',
    nameKey: 'options.f150.climateBarHybrid.name',
    descriptionKey: 'options.f150.climateBarHybrid.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-02-02',
    mask: 'xxx6 xxxx xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_climate_bar_heated_cooled_seats',
    name: 'Heated & Cooled Seats Climate Bar Enable',
    description: 'Enables Heated and Cooled Seats buttons on the Sync climate bar.',
    nameKey: 'options.f150.climateBarHeatedCooledSeats.name',
    descriptionKey: 'options.f150.climateBarHeatedCooledSeats.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-02-01',
    mask: 'xxxx xAxx xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_lightning_splash_screen',
    name: 'Lightning F-150 Splash Screen Enable',
    description: 'Enables Lightning F-150 EV boot splash screen on Sync display.',
    nameKey: 'options.f150.lightningSplashScreen.name',
    descriptionKey: 'options.f150.lightningSplashScreen.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-03-01',
    mask: 'xxxx 1Fxx xx--',
    safetyLevel: 'LOW'
  },
  {
    id: 'f150_oil_life_sync_settings',
    name: 'Oil Life Sync Settings Enable',
    description: 'Displays Oil Life monitor in Sync Settings > Vehicle menu.',
    nameKey: 'options.f150.oilLifeSyncSettings.name',
    descriptionKey: 'options.f150.oilLifeSyncSettings.description',
    category: 'CONVENIENCE',
    primaryModule: '7D0',
    targetAddress: '7D0-10-01',
    mask: 'x8xx xxxx xx--',
    bitValues: [{ 3: 1 }],
    safetyLevel: 'LOW'
  }
];
