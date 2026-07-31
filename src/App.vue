<template>
  <q-layout view="hHh lpR fFf" class="carfix-app">
    <!-- Top App Header / Status Bar -->
    <AppHeader />

    <!-- Page Container with Horizontal Swipe Navigation -->
    <q-page-container v-touch-swipe.horizontal="handleSwipe">
      <ConnectPage v-if="store.activeTab === 'connect'" />
      <PidDashboardPage v-else-if="store.activeTab === 'pids'" />
      <ModulesPage v-else-if="store.activeTab === 'modules'" />
      <ModuleOptionsPage v-else-if="store.activeTab === 'options'" />
    </q-page-container>

    <!-- Solid Opaque Navigation Bar -->
    <q-footer
      bordered
      class="carfix-bottom-bar text-primary"
      role="navigation"
      aria-label="Application Navigation"
    >
      <q-tabs
        v-model="store.activeTab"
        dense
        active-color="primary"
        indicator-color="primary"
        align="justify"
        class="text-caption nav-tabs-compact"
      >
        <q-tab name="connect" icon="bluetooth" label="Connect" aria-label="Connect Tab" />
        <q-tab name="pids" icon="speed" label="Telemetry" aria-label="Telemetry Tab" />
        <q-tab name="modules" icon="memory" label="Modules" aria-label="Modules Tab" />
        <q-tab name="options" icon="tune" label="Options" aria-label="Options Tab" />
      </q-tabs>
    </q-footer>
    <!-- Global Module Write Transmission Preview Dialog (Troubleshooting Mode) -->
    <TransmitPreviewDialog
      v-model="store.showTransmitPreview"
      :transmit-info="store.lastSimulatedTransmit"
    />
    <!-- Version-Aware Disclaimer Agreement Modal -->
    <DisclaimerDialog
      v-model="store.showDisclaimerModal"
      @agree="store.acceptDisclaimer()"
    />
  </q-layout>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useCarFixStore } from './stores/carfixStore';
import AppHeader from './components/AppHeader.vue';
import TransmitPreviewDialog from './components/TransmitPreviewDialog.vue';
import DisclaimerDialog from './components/DisclaimerDialog.vue';
import ConnectPage from './pages/ConnectPage.vue';
import PidDashboardPage from './pages/PidDashboardPage.vue';
import ModuleOptionsPage from './pages/ModuleOptionsPage.vue';
import ModulesPage from './pages/ModulesPage.vue';

import { preferencesManager } from './core/storage/preferencesManager';

const $q = useQuasar();
const store = useCarFixStore();

function handleSwipe(details: { direction: 'left' | 'right' | 'up' | 'down' }) {
  if (details.direction === 'left') {
    store.nextTab();
  } else if (details.direction === 'right') {
    store.prevTab();
  }
}

onMounted(async () => {
  const savedDarkTheme = await preferencesManager.loadDarkThemePref();
  if (savedDarkTheme !== null) {
    $q.dark.set(savedDarkTheme);
  } else {
    $q.dark.set('auto');
  }
  await store.initializeDashboard();
  if (store.autoConnect && store.selectedDeviceAddress) {
    try {
      await store.connectAdapter();
    } catch {
      // silently ignore; user can connect manually
    }
  }

});

</script>

<style scoped lang="scss">
:deep(.nav-tabs-compact .q-tab) {
  padding: 2px 2px !important;
  min-height: 44px !important;

  .q-tab__label {
    font-size: 11px !important;
    line-height: 1.1 !important;
    letter-spacing: 0 !important;
  }
  .q-tab__icon {
    font-size: 20px !important;
  }
}
</style>
