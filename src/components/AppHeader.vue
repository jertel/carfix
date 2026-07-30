<template>
  <q-header bordered class="carfix-header bg-primary text-white" elevation="1" role="banner">
    <q-toolbar dense class="row items-center justify-between no-wrap min-height-toolbar">
      <!-- Status Chip -->
      <div class="row items-center q-gutter-x-xs no-wrap col">
        <!-- 508 AA Compliant Status Chip -->
        <q-chip
          :color="statusColor"
          :text-color="statusTextColor"
          icon="circle"
          dense
          class="text-caption text-weight-bold header-status-chip"
          role="status"
          :aria-label="'Connection Status: ' + statusLabel"
        >
          {{ statusLabel }}
        </q-chip>
      </div>

      <!-- Contextual Action Buttons for Active Screen -->
      <div class="row items-center q-gutter-x-xs no-wrap">
        <!-- Modules View Action: Top-right Scan Modules button (icon only, no label) -->
        <template v-if="store.activeTab === 'modules'">
          <q-btn
            flat
            round
            dense
            size="sm"
            icon="refresh"
            color="white"
            class="header-icon-btn"
            :loading="store.isScanningModules"
            aria-label="Scan ECU Modules"
            @click="store.scanVehicleModules()"
          >
            <q-tooltip>Scan Vehicle ECU Module Software Versions</q-tooltip>
          </q-btn>
        </template>


        <!-- Telemetry PIDs View Actions -->
        <template v-else-if="store.activeTab === 'pids'">
          <q-btn
            v-if="store.isCompactDashboardMode"
            flat
            round
            dense
            size="sm"
            icon="fullscreen_exit"
            color="white"
            class="header-icon-btn"
            aria-label="Exit Compact Dashboard Mode"
            @click="store.toggleCompactDashboardMode()"
          >
            <q-tooltip class="text-caption shadow-2">Exit Compact Grid Mode</q-tooltip>
          </q-btn>
          <template v-else>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="add"
              color="white"
              class="header-icon-btn"
              aria-label="Open PID Selection Dialog"
              @click="store.openPidChooser()"
            >
              <q-tooltip class="text-caption shadow-2">Add Telemetry PID</q-tooltip>
            </q-btn>
            <q-btn
              flat
              round
              dense
              size="sm"
              icon="grid_view"
              color="white"
              class="header-icon-btn"
              aria-label="Toggle High-Density Compact Dashboard View"
              @click="store.toggleCompactDashboardMode()"
            >
              <q-tooltip class="text-caption shadow-2">Compact Grid View</q-tooltip>
            </q-btn>
          </template>

          <q-btn
            v-if="store.isConnected"
            flat
            round
            dense
            size="sm"
            icon="refresh"
            color="white"
            class="header-icon-btn"
            :disable="store.isWriting"
            aria-label="Refresh Telemetry PIDs"
            @click="store.pollTelemetryOnce()"
          >
            <q-tooltip class="text-caption shadow-2">Refresh Telemetry PIDs</q-tooltip>
          </q-btn>
        </template>
      </div>
    </q-toolbar>
  </q-header>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCarFixStore } from '../stores/carfixStore';

const store = useCarFixStore();

const statusLabel = computed(() => {
  if (store.isConnecting) return 'CONNECTING';
  if (!store.isConnected) return 'DISCONNECTED';
  if (store.isSimulationMode) return 'DEMO MODE';
  return store.activeAdapter ? `CONNECTED (${store.activeAdapter})` : 'CONNECTED';
});

const statusColor = computed(() => {
  if (store.isConnecting) return 'warning';
  if (!store.isConnected) return 'grey-7';
  return store.isSimulationMode ? 'amber-9' : 'positive';
});

const statusTextColor = computed(() => {
  if (store.isConnecting || (store.isConnected && store.isSimulationMode)) return 'dark';
  return 'white';
});
</script>

<style scoped lang="scss">
.carfix-header {
  height: 42px;
}

.min-height-toolbar {
  min-height: 42px !important;
  height: 42px !important;
}

.header-status-chip {
  height: 22px;
  font-size: 0.7rem;
}

.header-labeled-btn {
  font-size: 0.75rem;
  border-radius: 4px;
}

.header-icon-btn {
  font-size: 0.75rem;
}
</style>
