<template>
  <q-page class="q-pa-md">
    <div class="row justify-center">
      <div class="col-12 col-md-8">
        <q-card class="carfix-card q-mb-md" flat borderless>
          <!-- Adapter Status Header -->
          <q-card-section class="text-center q-pb-xs">
            <q-icon name="bluetooth_connected" size="48px" color="primary" role="img" aria-label="Bluetooth icon" />
          </q-card-section>

          <!-- Paired Bluetooth Device Selector -->
          <div v-if="!store.isConnected" class="q-px-md q-pb-md">
            <q-select
              v-model="store.selectedDeviceAddress"
              :options="deviceOptions"
              option-value="value"
              option-label="label"
              emit-value
              map-options
              outlined
              dense
              :disable="store.isConnecting"
              label="Select OBDII Bluetooth Adapter"
              aria-label="Select OBDII Bluetooth Adapter"
              class="full-width"
              @update:model-value="(val: string) => store.setSelectedDeviceAddress(val)"
            >
              <template #prepend>
                <q-icon name="bluetooth" color="primary" />
              </template>
            </q-select>
          </div>

          <!-- Connection Action Button -->
          <q-card-actions class="justify-center q-pb-md">
            <q-btn
              v-if="!store.isConnected"
              color="primary"
              size="lg"
              icon="power_settings_new"
              :label="store.isConnecting ? 'Connecting...' : 'Connect'"
              :loading="store.isConnecting"
              :disable="store.isConnecting"
              aria-label="Connect to Vehicle OBD Adapter"
              @click="handleConnect()"
            />
            <q-btn
              v-else
              color="negative"
              size="lg"
              icon="power_off"
              label="Disconnect"
              aria-label="Disconnect Vehicle OBD Adapter"
              @click="store.disconnectAdapter()"
            />
          </q-card-actions>

          <!-- Connection Status Step Banner -->
          <div
            v-if="store.isConnecting"
            class="q-mx-md q-mb-md q-pa-sm rounded-borders bg-blue-1 dark:bg-blue-10 text-primary dark:text-blue-2 row items-center justify-center q-gutter-x-sm"
            role="status"
            aria-live="polite"
          >
            <q-spinner-dots size="20px" color="primary" />
            <span class="text-caption text-weight-bold">{{ store.connectionStatusText || 'Connecting...' }}</span>
          </div>

          <div v-if="connectionError" class="q-px-md q-pb-sm carfix-error-text text-caption text-center text-weight-bold" role="alert">
            {{ connectionError }}
          </div>

          <q-separator v-if="store.isConnected" class="q-my-md" />

          <!-- Automatic VIN Detection Vehicle Profile Section -->
          <q-card-section v-if="store.isConnected">
            <div class="text-subtitle1 text-weight-medium q-mb-xs">Detected Vehicle Profile</div>

            <div class="carfix-card q-pa-md bg-grey-1 dark:bg-grey-9">
              <div class="row items-center justify-between">
                <div class="row items-center q-gutter-x-sm">
                  <q-icon name="directions_car" size="28px" color="primary" />
                  <div>
                    <div class="text-subtitle1 text-weight-bold">
                      {{ store.activeModule?.name || 'Auto-Detecting Vehicle...' }}
                    </div>
                    <div class="text-caption font-mono text-grey-7 dark:text-grey-4">
                      VIN: {{ store.connectedVin }}
                    </div>
                  </div>
                </div>

                <div class="row items-center q-gutter-x-xs">
                  <span class="status-indicator-dot" :class="store.isVinMatched ? 'bg-positive' : 'bg-negative'"></span>
                  <span class="text-caption text-weight-bold" :class="store.isVinMatched ? 'text-positive' : 'carfix-error-text'">
                    {{ store.isVinMatched ? 'MATCHED' : 'UNSUPPORTED' }}
                  </span>
                </div>
              </div>
            </div>
          </q-card-section>
        </q-card>

        <!-- Collapsible Monospace Diagnostic Log Pane -->
        <q-expansion-item
          icon="terminal"
          :label="'Logs (' + store.logs.length + ')'"
          header-class="carfix-card text-subtitle2 text-weight-bold"
          class="q-mb-md"
        >
          <q-card flat borderless class="q-pa-xs">
            <div class="row items-center justify-between wrap q-pa-xs q-gutter-sm">
              <div class="row items-center q-gutter-x-sm">
                <!-- Tx/Rx Debug Traffic Logging Toggle Button -->
                <q-btn
                  flat
                  dense
                  size="sm"
                  icon="swap_vert"
                  label="Tx/Rx"
                  :color="store.isDebugLoggingEnabled ? 'secondary' : 'grey-7'"
                  class="q-px-xs"
                  aria-label="Toggle Tx/Rx Traffic Logging"
                  @click="store.setDebugLogging(!store.isDebugLoggingEnabled)"
                >
                  <q-tooltip class="text-caption shadow-2">
                    {{ store.isDebugLoggingEnabled ? 'Tx/Rx Traffic Logging Active' : 'Enable Tx/Rx Traffic Logging' }}
                  </q-tooltip>
                </q-btn>

                <!-- Auto-Scroll Toggle Button -->
                <q-btn
                  flat
                  dense
                  size="sm"
                  icon="vertical_align_bottom"
                  label="Scroll"
                  :color="autoScroll ? 'primary' : 'grey-7'"
                  :disable="store.logs.length === 0"
                  class="q-px-xs"
                  aria-label="Keep diagnostic log scrolled to bottom"
                  @click="toggleAutoScroll()"
                >
                  <q-tooltip class="text-caption shadow-2">
                    {{ autoScroll ? 'Auto-scroll ON (Scrolled to Bottom)' : 'Auto-scroll OFF (Click to Enable)' }}
                  </q-tooltip>
                </q-btn>
              </div>

              <div class="row items-center q-gutter-x-xs">
                <!-- Save / Share Button (Icon Only) -->
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="share"
                  color="secondary"
                  :disable="store.logs.length === 0"
                  aria-label="Save or Share Diagnostic Logs"
                  @click="saveLogFile()"
                >
                  <q-tooltip class="text-caption shadow-2">Save Logs to File</q-tooltip>
                </q-btn>

                <!-- Copy Button (Icon Only) -->
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="content_copy"
                  color="primary"
                  :disable="store.logs.length === 0"
                  aria-label="Copy Diagnostic Logs to Clipboard"
                  @click="copyLogs()"
                >
                  <q-tooltip class="text-caption shadow-2">Copy Logs to Clipboard</q-tooltip>
                </q-btn>

                <!-- Clear Button (Icon Only) -->
                <q-btn
                  flat
                  round
                  dense
                  size="sm"
                  icon="delete"
                  color="grey-7"
                  :disable="store.logs.length === 0"
                  aria-label="Clear Diagnostic Logs"
                  @click="store.clearLogs()"
                >
                  <q-tooltip class="text-caption shadow-2">Clear Diagnostic Logs</q-tooltip>
                </q-btn>
              </div>
            </div>

            <!-- Scrollable Log Container -->
            <div
              ref="logContainerRef"
              class="log-pane-container bg-black text-grey-2 q-pa-sm rounded-borders font-mono"
              role="log"
              aria-live="polite"
            >
              <div v-if="store.logs.length === 0" class="text-grey-6 text-caption text-italic">
                No diagnostic log entries recorded.
              </div>
              <div
                v-for="log in store.logs"
                :key="log.id"
                class="log-line text-caption"
                :class="getLogLevelClass(log.level)"
              >
                [{{ formatLogTime(log.timestampISO) }}] {{ log.level }}: {{ log.message }}
              </div>
            </div>
          </q-card>
        </q-expansion-item>
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useCarFixStore } from '../stores/carfixStore';
import { formatLocalizedTime, getSystemTimezone } from '../core/utils/dateTimeUtils';
import { exportLogsToFile } from '../core/utils/logExporter';

const $q = useQuasar();
const store = useCarFixStore();
const connectionError = ref('');

const autoScroll = ref(true);
const logContainerRef = ref<HTMLDivElement | null>(null);

function scrollToBottom() {
  if (logContainerRef.value) {
    logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
  }
}

function toggleAutoScroll() {
  autoScroll.value = !autoScroll.value;
  if (autoScroll.value) {
    nextTick(() => {
      scrollToBottom();
    });
  }
}

watch(
  () => store.logs.length,
  () => {
    if (autoScroll.value) {
      nextTick(() => {
        scrollToBottom();
      });
    }
  }
);

const deviceOptions = computed(() => {
  return store.pairedDevices.map(d => ({
    label: d.address === 'DEMO_MODE' ? d.name : `${d.name} (${d.address})`,
    value: d.address
  }));
});

function formatLogTime(iso: string): string {
  const time = formatLocalizedTime(iso, 'en-US', getSystemTimezone());
  return time || iso.substring(11, 19);
}

function getLogLevelClass(level: 'INF' | 'WRN' | 'ERR'): string {
  switch (level) {
    case 'INF': return 'text-green-4';
    case 'WRN': return 'text-amber-4';
    case 'ERR': return 'text-red-4';
    default: return 'text-grey-3';
  }
}

async function handleConnect() {
  connectionError.value = '';
  try {
    await store.connectAdapter();
  } catch (err: any) {
    connectionError.value = err?.message || 'Failed to connect to OBD adapter.';
  }
}

function copyLogs() {
  const text = store.logs
    .map(l => `[${formatLogTime(l.timestampISO)}] ${l.level}: ${l.message}`)
    .join('\n');
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text);
    $q.notify({
      type: 'positive',
      message: 'Diagnostic logs copied to clipboard.',
      timeout: 2000
    });
  }
}

async function saveLogFile() {
  const text = store.logs
    .map(l => `[${formatLogTime(l.timestampISO)}] ${l.level}: ${l.message}`)
    .join('\n');
  const filename = `carcommander_logs_${Date.now()}.txt`;

  const result = await exportLogsToFile(text, filename);
  if (result.success) {
    $q.notify({
      type: 'positive',
      message: result.method.startsWith('native')
        ? 'Diagnostic logs saved/shared successfully.'
        : 'Diagnostic log file downloaded.',
      timeout: 3000
    });
  } else {
    $q.notify({
      type: 'negative',
      message: `Failed to export logs: ${result.error || 'Unknown error'}`,
      timeout: 4000
    });
  }
}

onMounted(() => {
  store.fetchPairedDevices();
});
</script>

<style scoped lang="scss">
.status-indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-block;
}

.log-pane-container {
  max-height: 240px;
  overflow-y: auto;
  font-family: monospace, Courier, monospace;
}

.log-line {
  white-space: pre-wrap;
  word-break: break-word;
  line-height: 1.4;
  margin-bottom: 2px;
}
</style>
