<template>
  <q-page class="q-pa-xs q-pa-sm-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-9">
        <!-- Options Sub-Tabs: Display First, then Behavior -->
        <q-tabs
          v-model="activeOptionsSubTab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="justify"
          class="text-caption carfix-card q-mb-md"
          role="tablist"
          aria-label="Application Options Categories"
        >
          <q-tab name="display" icon="palette" :label="t('appSettings.displayTitle')" aria-label="Display Options Tab" />
          <q-tab name="behavior" icon="tune" :label="t('appSettings.behaviorTitle')" aria-label="Behavior Options Tab" />
        </q-tabs>

        <!-- Tab Panels Container -->
        <q-tab-panels v-model="activeOptionsSubTab" animated class="bg-transparent">
          <!-- TAB 1: Display Options -->
          <q-tab-panel name="display" class="q-pa-none">
            <q-card flat borderless class="q-pa-xs">
              <q-list separator class="rounded-borders">
                <!-- Dark / Light Theme Toggle -->
                <q-item class="q-py-md carfix-card q-mb-sm">
                  <q-item-section avatar>
                    <q-icon :name="$q.dark.isActive ? 'dark_mode' : 'light_mode'" color="primary" size="24px" />
                  </q-item-section>

                  <q-item-section>
                    <div class="text-subtitle1 text-weight-bold">{{ t('appSettings.darkTheme') }}</div>
                    <div class="text-caption text-grey-7 dark:text-grey-4">
                      {{ t('appSettings.darkThemeDesc') }}
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-toggle
                      :model-value="$q.dark.isActive"
                      color="primary"
                      size="lg"
                      aria-label="Toggle Dark Theme"
                      @update:model-value="onDarkThemeToggle"
                    />
                  </q-item-section>
                </q-item>

                <!-- Compact Dashboard Grid Toggle -->
                <q-item class="q-py-md carfix-card q-mb-sm">
                  <q-item-section avatar>
                    <q-icon name="grid_view" color="primary" size="24px" />
                  </q-item-section>

                  <q-item-section>
                    <div class="text-subtitle1 text-weight-bold">{{ t('appSettings.compactGrid') }}</div>
                    <div class="text-caption text-grey-7 dark:text-grey-4">
                      {{ t('appSettings.compactGridDesc') }}
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-toggle
                      :model-value="store.isCompactDashboardMode"
                      color="primary"
                      size="lg"
                      aria-label="Toggle High-Density Compact Grid"
                      @update:model-value="store.toggleCompactDashboardMode()"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-tab-panel>

          <!-- TAB 2: Behavior Options -->
          <q-tab-panel name="behavior" class="q-pa-none">
            <q-card flat borderless class="q-pa-xs">
              <q-list separator class="rounded-borders">
                <!-- Telemetry Rate Dropdown Setting -->
                <q-item class="q-py-md carfix-card q-mb-sm">
                  <q-item-section avatar>
                    <q-icon name="speed" color="primary" size="24px" />
                  </q-item-section>

                  <q-item-section>
                    <div class="text-subtitle1 text-weight-bold">{{ t('appSettings.telemetryRate') }}</div>
                    <div class="text-caption text-grey-7 dark:text-grey-4">
                      {{ t('appSettings.telemetryRateDesc') }}
                    </div>
                  </q-item-section>

                  <q-item-section side style="min-width: 140px;">
                    <q-select
                      v-model="selectedTelemetryRate"
                      :options="telemetryRateOptions"
                      option-value="value"
                      option-label="label"
                      emit-value
                      map-options
                      dense
                      outlined
                      options-dense
                      class="carfix-card rounded-borders font-sans full-width"
                      aria-label="Telemetry Rate"
                      @update:model-value="onTelemetryRateChange"
                    />
                  </q-item-section>
                </q-item>
                 <!-- Auto Connect Toggle -->
                <q-item class="q-py-md carfix-card q-mb-sm">
                  <q-item-section avatar>
                    <q-icon name="bluetooth_connected" color="primary" size="24px" />
                  </q-item-section>

                  <q-item-section>
                    <div class="text-subtitle1 text-weight-bold">{{ t('appSettings.autoConnect') }}</div>
                    <div class="text-caption text-grey-7 dark:text-grey-4">
                      {{ t('appSettings.autoConnectDesc') }}
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-toggle
                      :model-value="store.autoConnect"
                      color="primary"
                      size="lg"
                      aria-label="Toggle Auto Connect"
                      @update:model-value="store.setAutoConnect($event)"
                    />
                  </q-item-section>
                </q-item>

                <!-- Auto Reconnect Toggle -->
                <q-item class="q-py-md carfix-card q-mb-sm">
                  <q-item-section avatar>
                    <q-icon name="settings_backup_restore" color="primary" size="24px" />
                  </q-item-section>

                  <q-item-section>
                    <div class="text-subtitle1 text-weight-bold">{{ t('appSettings.autoReconnect') }}</div>
                    <div class="text-caption text-grey-7 dark:text-grey-4">
                      {{ t('appSettings.autoReconnectDesc') }}
                    </div>
                  </q-item-section>

                  <q-item-section side>
                    <q-toggle
                      :model-value="store.autoReconnect"
                      color="primary"
                      size="lg"
                      aria-label="Toggle Auto Reconnect"
                      @update:model-value="store.setAutoReconnect($event)"
                    />
                  </q-item-section>
                </q-item>
              </q-list>
            </q-card>
          </q-tab-panel>

        </q-tab-panels>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import { useQuasar } from 'quasar';
import { useCarFixStore } from '../stores/carfixStore';
import { t } from '../core/i18n/translations';
import { preferencesManager } from '../core/storage/preferencesManager';

const $q = useQuasar();
const store = useCarFixStore();

const activeOptionsSubTab = ref<'display' | 'behavior'>('display');

onMounted(async () => {
  const savedTab = await preferencesManager.loadOptionsSubTabPref();
  if (savedTab) {
    activeOptionsSubTab.value = savedTab;
  }
});

watch(activeOptionsSubTab, async (newTab) => {
  await preferencesManager.saveOptionsSubTabPref(newTab);
});

async function onDarkThemeToggle(val: boolean) {
  $q.dark.set(val);
  await preferencesManager.saveDarkThemePref(val);
}

const selectedTelemetryRate = computed({
  get: () => store.telemetryRate,
  set: (val: number) => {
    store.setTelemetryRate(val);
  }
});

const telemetryRateOptions = computed(() => [
  { label: t('telemetryRate.0'), value: 0 },
  { label: t('telemetryRate.1'), value: 1 },
  { label: t('telemetryRate.2'), value: 2 },
  { label: t('telemetryRate.3'), value: 3 },
  { label: t('telemetryRate.5'), value: 5 },
  { label: t('telemetryRate.10'), value: 10 },
  { label: t('telemetryRate.30'), value: 30 },
  { label: t('telemetryRate.60'), value: 60 }
]);

function onTelemetryRateChange(val: number) {
  store.setTelemetryRate(val);
}
</script>


<style scoped lang="scss">
.font-mono {
  font-family: monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo;
}
</style>
