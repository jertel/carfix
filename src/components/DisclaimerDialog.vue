<template>
  <q-dialog
    v-model="isOpen"
    persistent
    maximized
    no-esc-dismiss
    no-backdrop-dismiss
    transition-show="fade"
    transition-hide="fade"
    role="dialog"
    aria-modal="true"
    aria-labelledby="disclaimer-dialog-title"
    aria-describedby="disclaimer-dialog-body"
  >
    <q-card
      flat
      square
      class="carfix-card disclaimer-card"
      style="width: 100vw; height: 100vh; display: flex; flex-direction: column;"
    >
      <!-- Header -->
      <q-card-section class="q-px-md q-py-sm border-bottom header-section">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-x-sm no-wrap col">
            <q-icon name="gavel" size="24px" color="primary" class="shrink-0" />
            <h2 id="disclaimer-dialog-title" class="text-subtitle1 text-weight-bold ellipsis q-ma-none">
              {{ t('disclaimer.title') }}
            </h2>
          </div>
          <q-badge color="primary" outline class="q-ml-sm text-weight-medium">
            v{{ APP_VERSION }}
          </q-badge>
        </div>
      </q-card-section>

      <!-- Body / Notice Content (508 AA Compliant) -->
      <q-card-section id="disclaimer-dialog-body" class="q-pa-md scrollable-body col flex flex-center">
        <div style="max-width: 680px; width: 100%;">
          <div class="q-pa-md rounded-borders warning-block-aa q-mb-md">
            <div class="row items-start no-wrap q-gutter-x-sm">
              <q-icon name="warning" color="warning" size="24px" class="shrink-0 q-mt-xs" />
              <div>
                <div class="text-subtitle2 text-weight-bold warning-title-aa q-mb-xs">
                  {{ t('disclaimer.noticeHeading') }}
                </div>
                <div class="text-body2 warning-text-aa">
                  {{ t('disclaimer.noticeBody') }}
                </div>
                <div class="text-body2 warning-text-aa q-mt-sm">
                  {{ t('disclaimer.noticeBodyParagraph2') }}
                </div>
                <div class="text-body2 warning-text-aa q-mt-sm">
                  {{ t('disclaimer.noticeBodyParagraph3') }}
                </div>
                <div class="text-body2 warning-text-aa q-mt-sm">
                  {{ t('disclaimer.noticeBodyParagraph4') }}
                </div>
              </div>
            </div>
          </div>

          <div class="text-body2 text-muted q-px-xs">
            {{ t('disclaimer.acknowledgment') }}
          </div>
        </div>
      </q-card-section>

      <!-- Action Footer -->
      <q-card-actions align="center" class="q-px-md q-py-md border-top footer-section">
        <div style="max-width: 680px; width: 100%;" class="row justify-end">
          <q-btn
            id="disclaimer-agree-btn"
            unelevated
            color="primary"
            icon="check_circle"
            size="lg"
            class="full-width-mobile"
            :label="t('disclaimer.agreeButton')"
            aria-label="Agree to disclaimer notice and proceed to use application"
            @click="onAgree"
          />
        </div>
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { APP_VERSION } from '../core/config/appVersion';
import { t } from '../core/i18n/translations';

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
  (e: 'agree'): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

function onAgree() {
  emit('agree');
}
</script>

<style scoped>
.disclaimer-card {
  border-radius: 12px;
  background: var(--q-card-bg, #ffffff);
  color: var(--q-text-color, #1d2129);
}

.body--dark .disclaimer-card {
  background: #1e2530;
  color: #f0f4f8;
}

.border-bottom {
  border-bottom: 1px solid rgba(128, 128, 128, 0.2);
}

.border-top {
  border-top: 1px solid rgba(128, 128, 128, 0.2);
}

.scrollable-body {
  overflow-y: auto;
}

.warning-block-aa {
  background: rgba(255, 152, 0, 0.12);
  border: 1px solid rgba(255, 152, 0, 0.4);
}

.body--dark .warning-block-aa {
  background: rgba(255, 152, 0, 0.18);
  border: 1px solid rgba(255, 152, 0, 0.5);
}

.warning-title-aa {
  color: #8c4a00;
}

.body--dark .warning-title-aa {
  color: #ffa726;
}

.warning-text-aa {
  color: #2c2c2c;
  line-height: 1.5;
}

.body--dark .warning-text-aa {
  color: #e0e6ed;
}

.text-muted {
  color: #555555;
}

.body--dark .text-muted {
  color: #b0bec5;
}

@media (max-width: 599px) {
  .full-width-mobile {
    width: 100%;
  }
}
</style>
