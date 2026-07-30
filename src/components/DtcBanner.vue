<template>
  <div class="dtc-banner-container q-mb-md">
    <!-- Active DTCs Detected Alert Card -->
    <q-card v-if="store.activeDtcs.length > 0" flat borderless class="carfix-card dtc-card border-warning-subtle q-pa-sm">
      <q-card-section class="q-pa-xs">
        <div class="row items-center justify-between no-wrap q-mb-xs">
          <div class="row items-center q-gutter-x-xs no-wrap col">
            <q-icon name="warning" color="warning" size="24px" class="shrink-0" />
            <span class="text-subtitle2 text-sm-subtitle1 text-weight-bold">
              Diagnostic Trouble Codes ({{ store.activeDtcs.length }})
            </span>
          </div>

          <div class="row items-center q-gutter-x-xs no-wrap shrink-0">
            <q-btn
              flat
              dense
              icon="refresh"
              color="primary"
              :loading="store.isScanningDtcs"
              aria-label="Rescan DTC Codes"
              @click="store.scanDtcCodes()"
            >
              <q-tooltip>Rescan DTCs</q-tooltip>
            </q-btn>

            <q-btn
              flat
              dense
              icon="cleaning_services"
              color="negative"
              aria-label="Clear All Diagnostic Trouble Codes"
              @click="showClearModal = true"
            >
              <q-tooltip>Clear DTC Codes</q-tooltip>
            </q-btn>
          </div>
        </div>

        <!-- DTC Codes List (Transparent Background Inheriting Parent Card) -->
        <div class="q-gutter-y-xs q-mt-xs">
          <div
            v-for="dtc in store.activeDtcs"
            :key="dtc.code"
            class="row items-center justify-between q-pa-xs rounded-borders carfix-dtc-item no-wrap"
          >
            <div class="row items-center q-gutter-x-xs no-wrap col">
              <q-badge color="negative" class="font-mono text-subtitle2 text-weight-bold shrink-0">
                {{ dtc.code }}
              </q-badge>

              <!-- Subtle Outlined Status Pill -->
              <span
                class="dtc-status-pill shrink-0"
                :class="'status-' + dtc.status.toLowerCase()"
              >
                {{ dtc.status }}
              </span>

              <span class="text-caption text-weight-medium ellipsis col q-ml-xs dtc-desc-text">
                {{ dtc.description }}
              </span>
            </div>
          </div>
        </div>
      </q-card-section>
    </q-card>

    <!-- No DTC Codes Status Card -->
    <div v-else-if="store.isConnected" class="row items-center justify-between carfix-card q-pa-xs q-px-sm rounded-borders">
      <div class="row items-center q-gutter-x-xs">
        <q-icon name="check_circle" color="positive" size="20px" />
        <span class="text-caption text-weight-bold text-positive">No Diagnostic Trouble Codes Found (0 DTCs)</span>
      </div>

      <q-btn
        flat
        dense
        icon="refresh"
        color="primary"
        size="sm"
        :loading="store.isScanningDtcs"
        aria-label="Scan DTC Codes"
        @click="store.scanDtcCodes()"
      >
        <q-tooltip>Scan DTCs</q-tooltip>
      </q-btn>
    </div>

    <!-- Confirm Clear DTC Modal -->
    <q-dialog v-model="showClearModal" persistent role="dialog" aria-label="Confirm Clear DTC Codes">
      <q-card flat borderless class="carfix-card" style="min-width: 280px; max-width: 90vw;">
        <q-card-section class="row items-center q-pb-none">
          <q-icon name="cleaning_services" color="negative" size="28px" class="q-mr-sm" />
          <div class="text-subtitle1 text-weight-bold">Clear All DTC Codes?</div>
        </q-card-section>

        <q-card-section class="q-pt-sm text-body2">
          This will issue SAE Mode 04 to clear diagnostic trouble codes and reset check engine light indicators. Continue?
        </q-card-section>

        <q-card-actions align="right">
          <q-btn flat label="Cancel" color="primary" v-close-popup />
          <q-btn label="Clear Codes" color="negative" v-close-popup @click="store.clearDtcCodes()" />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useCarFixStore } from '../stores/carfixStore';
import { DtcStatus } from '../core/obd/dtcDecoder';

const store = useCarFixStore();
const showClearModal = ref(false);

function getStatusBadgeColor(status: DtcStatus): string {
  switch (status) {
    case 'STORED': return 'negative';
    case 'PENDING': return 'warning';
    case 'PERMANENT': return 'purple-9';
    default: return 'primary';
  }
}
</script>

<style scoped lang="scss">
.dtc-card {
  border-left: 4px solid var(--q-warning, #f2c037) !important;
}

.carfix-dtc-item {
  background-color: transparent !important;
  color: var(--carfix-text) !important;
  border-bottom: 1px solid var(--carfix-border) !important;
}

.shrink-0 {
  flex-shrink: 0 !important;
}

.dtc-desc-text {
  white-space: normal !important;
  word-break: break-word !important;
}

.dtc-status-pill {
  font-size: 0.68rem;
  font-weight: 700;
  letter-spacing: 0.5px;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid currentColor;
  text-transform: uppercase;

  &.status-stored {
    color: var(--carfix-error-text, #c10015);
  }
  &.status-pending {
    color: #d97706;
  }
  &.status-permanent {
    color: #8936b2;
  }
}

:deep(body.body--dark) {
  .dtc-status-pill.status-pending {
    color: #f59e0b;
  }
  .dtc-status-pill.status-permanent {
    color: #c084fc;
  }
}
</style>
