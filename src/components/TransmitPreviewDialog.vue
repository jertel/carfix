<template>
  <q-dialog
    v-model="isOpen"
    persistent
    transition-show="scale"
    transition-hide="scale"
    role="dialog"
    aria-label="Module Write Transmission Preview"
  >
    <q-card flat borderless class="carfix-card preview-card" style="min-width: 320px; max-width: 520px; width: 100%;">
      <!-- Header -->
      <q-card-section class="q-px-md q-py-sm border-bottom">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-x-xs no-wrap col">
            <q-icon name="bug_report" size="22px" color="warning" class="shrink-0" />
            <div class="col ellipsis">
              <div class="text-subtitle1 text-weight-bold ellipsis">{{ t('preview.title') }}</div>
              <div class="text-caption text-warning text-weight-bold ellipsis">{{ t('preview.subtitle') }}</div>
            </div>
          </div>
          <q-btn flat round dense icon="close" class="shrink-0" v-close-popup aria-label="Close preview dialog" />
        </div>
      </q-card-section>

      <!-- Details & High-Contrast 508 AA Warning Block -->
      <q-card-section class="q-pa-md">
        <!-- 508 AA Light & Dark Mode Compliant Alert Box -->
        <div class="q-pa-sm rounded-borders warning-block-aa q-mb-md">
          <div class="row items-start no-wrap q-gutter-x-xs">
            <q-icon name="info" color="warning" size="20px" class="shrink-0 q-mt-xs" />
            <div class="text-caption warning-text-aa">
              {{ t('preview.banner') }}
            </div>
          </div>
        </div>

        <div v-if="transmitInfo" class="q-gutter-y-xs">
          <!-- Metadata Table -->
          <div class="row q-col-gutter-xs text-caption">
            <div class="col-6">
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.module') }}:</span>
              <strong class="q-ml-xs text-primary font-mono">{{ transmitInfo.module }}</strong>
            </div>
            <div class="col-6">
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.address') }}:</span>
              <strong class="q-ml-xs text-primary font-mono">{{ transmitInfo.address }}</strong>
            </div>
            <div class="col-6">
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.did') }}:</span>
              <strong class="q-ml-xs font-mono">0x{{ transmitInfo.didHex }}</strong>
            </div>
            <div class="col-6">
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.service') }}:</span>
              <strong class="q-ml-xs font-mono">{{ transmitInfo.udsService }}</strong>
            </div>
          </div>

          <q-separator class="q-my-sm" />

          <!-- Hex Values and Transmitted Frame -->
          <div class="q-gutter-y-xs text-caption">
            <div>
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.previousHex') }}:</span>
              <div class="carfix-code-block q-pa-xs rounded-borders font-mono text-weight-bold q-mt-2xs">
                {{ transmitInfo.previousHex }}
              </div>
            </div>

            <div>
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.newHex') }}:</span>
              <div class="carfix-code-block q-pa-xs rounded-borders font-mono text-weight-bold text-positive q-mt-2xs">
                {{ transmitInfo.newHex }}
              </div>
            </div>

            <div>
              <span class="text-grey-7 dark:text-grey-4">{{ t('preview.rawCommand') }}:</span>
              <div class="carfix-code-block q-pa-xs rounded-borders font-mono text-weight-bold text-warning q-mt-2xs formatted-command">
                {{ transmitInfo.formattedCommand || transmitInfo.rawCommand }}
              </div>
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Action Bar -->
      <q-card-actions align="between" class="q-px-md q-pb-md q-pt-none">
        <q-btn
          flat
          dense
          color="primary"
          icon="content_copy"
          :label="t('preview.copyCommand')"
          @click="copyCommand"
        />
        <q-btn
          color="primary"
          :label="t('preview.close')"
          style="min-width: 90px;"
          v-close-popup
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useQuasar } from 'quasar';
import { ISimulatedTransmit } from '../core/obd/udsClient';
import { t } from '../core/i18n/translations';

const props = defineProps<{
  modelValue: boolean;
  transmitInfo: ISimulatedTransmit | null;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
}>();

const $q = useQuasar();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

function copyCommand() {
  if (!props.transmitInfo) return;
  const frame = props.transmitInfo.formattedCommand || props.transmitInfo.rawCommand;
  navigator.clipboard.writeText(frame);
  $q.notify({
    type: 'positive',
    message: t('preview.copied'),
    icon: 'content_copy',
    timeout: 2000
  });
}
</script>

<style scoped lang="scss">
/* 508 Level AA Compliant Warning Block for Light & Dark Modes */
.warning-block-aa {
  background-color: rgba(245, 124, 0, 0.08);
  border-left: 4px solid #f57c00;
}

.warning-text-aa {
  color: #37474f; /* 8.2:1 contrast ratio in light mode */
}

body.body--dark {
  .warning-block-aa {
    background-color: rgba(255, 183, 77, 0.12);
    border-left: 4px solid #ffb74d;
  }
  .warning-text-aa {
    color: #fff3e0; /* 12.5:1 contrast ratio in dark mode */
  }
}

.formatted-command {
  word-break: break-all;
}

.shrink-0 {
  flex-shrink: 0 !important;
}

.border-bottom {
  border-bottom: 1px solid rgba(0, 0, 0, 0.12);
}

body.body--dark .border-bottom {
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}
</style>
