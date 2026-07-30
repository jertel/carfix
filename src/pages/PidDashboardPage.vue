<template>
  <q-page class="q-pa-xs q-pa-sm-md">
    <!-- Compact High-Density Grid Mode Overlay -->
    <template v-if="store.isCompactDashboardMode">
      <!-- Diagnostic Trouble Codes (DTC) Top Dashboard Banner -->
      <DtcBanner />

      <div class="row q-col-gutter-xs">
        <div
          v-for="pid in store.sortedPids"
          :key="pid.definition.id"
          class="col-6 col-sm-4 col-md-3 col-lg-2"
        >
          <CompactPidTile :pid="pid" />
        </div>
      </div>
    </template>

    <!-- Standard Dashboard View -->
    <template v-else>


      <!-- Diagnostic Trouble Codes (DTC) Top Dashboard Banner -->
      <DtcBanner />

      <!-- PID Dashboard Cards Container -->
      <div v-if="store.sortedPids.length > 0" class="row q-col-gutter-xs q-col-gutter-sm-sm">
        <div
          v-for="pid in store.sortedPids"
          :key="pid.definition.id"
          class="col-12 col-sm-6 col-md-4"
        >
          <PidCard
            :pid="pid"
            @reorder="(draggedId, targetId, position) => store.insertPidAtTarget(draggedId, targetId, position)"
            @remove="(pidId) => store.removePidFromDashboard(pidId)"
          />
        </div>
      </div>

      <!-- Empty State -->
      <div v-else class="text-center q-pa-xl">
        <q-icon name="speed" size="64px" color="grey-5" />
        <div class="text-h6 text-grey-7 dark:text-grey-4 q-mt-md">No Telemetry PIDs Active</div>
        <p class="text-caption text-grey-6">Click "Add PID" in the top bar to choose standard OBDII or Ford OEM PIDs for your dashboard.</p>
        <q-btn color="primary" label="Add Telemetry PID" icon="add" class="q-mt-sm" @click="store.openPidChooser()" />
      </div>

      <!-- PID Chooser Dialog Component -->
      <PidChooserDialog v-model="store.isPidChooserOpen" />
    </template>
  </q-page>
</template>

<script setup lang="ts">
import { useCarFixStore } from '../stores/carfixStore';
import PidCard from '../components/PidCard.vue';
import CompactPidTile from '../components/CompactPidTile.vue';
import PidChooserDialog from '../components/PidChooserDialog.vue';
import DtcBanner from '../components/DtcBanner.vue';

const store = useCarFixStore();
</script>
