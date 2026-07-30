<template>
  <q-dialog
    v-model="isOpen"
    persistent
    transition-show="scale"
    transition-hide="scale"
    role="dialog"
    aria-label="Extended Diagnostics Safety Confirmation"
  >
    <q-card flat borderless class="carfix-card ext-diag-card" style="min-width: 300px; max-width: 440px; width: 100%;">
      <!-- Card Header -->
      <q-card-section class="q-px-md q-py-sm border-bottom">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-x-xs no-wrap col">
            <q-icon name="warning" size="22px" color="warning" class="shrink-0" />
            <span class="text-subtitle1 text-weight-bold ellipsis">{{ t('options.extDiagTitle') }}</span>
          </div>
          <q-btn
            flat
            round
            dense
            icon="close"
            class="shrink-0"
            v-close-popup
            aria-label="Cancel diagnostic entry"
            @click="onCancel"
          />
        </div>
      </q-card-section>

      <!-- Warning Content Section (508 AA Compliant) -->
      <q-card-section class="q-pa-md">
        <div class="q-pa-sm rounded-borders warning-block-aa q-mb-md">
          <div class="row items-start no-wrap q-gutter-x-sm">
            <q-icon name="report_problem" color="warning" size="22px" class="shrink-0 q-mt-xs" />
            <div class="text-body2 warning-text-aa">
              {{ t('options.extDiagWarning') }}
            </div>
          </div>
        </div>
      </q-card-section>

      <!-- Action Buttons -->
      <q-card-actions align="right" class="q-px-md q-pb-md q-pt-none q-gutter-x-sm">
        <q-btn
          flat
          color="grey-7"
          :label="t('options.cancelRead')"
          aria-label="Cancel option read"
          @click="onCancel"
        />
        <q-btn
          unelevated
          color="primary"
          icon="sensors"
          :label="t('options.confirmRead')"
          aria-label="Confirm enter diagnostics and read options"
          @click="onConfirm"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { t } from '../core/i18n/translations';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'confirm'): void;
  (e: 'cancel'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

function onCancel() {
  emit('update:modelValue', false);
  emit('cancel');
}

function onConfirm() {
  emit('update:modelValue', false);
  emit('confirm');
}
</script>

<style scoped>
.ext-diag-card {
  border-radius: 12px;
  background: var(--q-card-bg, #ffffff);
  color: var(--q-text-color, #1d2129);
}

.body--dark .ext-diag-card {
  background: #1e2530;
  color: #f0f4f8;
}

.border-bottom {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.warning-block-aa {
  background: rgba(255, 152, 0, 0.12);
  border: 1px solid rgba(255, 152, 0, 0.4);
}

.body--dark .warning-block-aa {
  background: rgba(255, 152, 0, 0.18);
  border: 1px solid rgba(255, 152, 0, 0.5);
}

.warning-text-aa {
  color: #8c4a00;
  line-height: 1.4;
}

.body--dark .warning-text-aa {
  color: #ffb74d;
}
</style>
