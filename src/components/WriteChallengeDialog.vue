<template>
  <q-dialog
    v-model="isOpen"
    persistent
    transition-show="scale"
    transition-hide="scale"
    role="dialog"
    aria-label="Vehicle Write Safety Challenge"
  >
    <q-card flat borderless class="carfix-card challenge-card" style="min-width: 300px; max-width: 440px; width: 100%;">
      <!-- Standard Normal Header -->
      <q-card-section class="q-px-md q-py-sm border-bottom">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-x-xs no-wrap col">
            <q-icon name="verified_user" size="22px" color="primary" class="shrink-0" />
            <span class="text-subtitle1 text-weight-bold ellipsis">{{ t('challenge.title') }}</span>
          </div>
          <q-btn flat round dense icon="close" class="shrink-0" v-close-popup aria-label="Cancel write action" @click="resetHold" />
        </div>
      </q-card-section>

      <!-- Details & High-Contrast 508 AA Warning Block -->
      <q-card-section class="q-pa-md">
        <div class="text-subtitle1 text-weight-bold text-primary ellipsis">
          {{ getOptionLocalizedTitle(option) }}
        </div>
        <div class="text-caption text-grey-7 dark:text-grey-4 q-mb-sm">
          {{ t('challenge.targetEcu') }}: <strong>{{ option?.primaryModule }}</strong> ({{ t('challenge.address') }}: <strong>{{ option?.targetAddress }}</strong>)
        </div>

        <!-- 508 AA Light & Dark Mode Compliant Warning Section -->
        <div class="q-pa-sm rounded-borders warning-block-aa q-mb-md">
          <div class="row items-start no-wrap q-gutter-x-xs">
            <q-icon name="warning" color="warning" size="20px" class="shrink-0 q-mt-xs" />
            <div class="text-caption warning-text-aa">
              {{ t('challenge.warning') }}
            </div>
          </div>
        </div>

        <!-- Touch-Friendly 3-Second Press & Hold Gesture -->
        <div class="text-caption text-grey-7 dark:text-grey-4 text-center q-mb-sm">
          {{ t('challenge.holdInstruction') }}
        </div>

        <!-- Integrated Progress Bar Inside Hold Button -->
        <div class="row justify-center">
          <button
            class="hold-to-confirm-btn text-subtitle2 text-weight-bold text-white rounded-borders shadow-2"
            :class="{ 'is-holding': isHolding }"
            :style="btnStyle"
            aria-label="Press and hold 3 seconds to authorize write"
            @touchstart.prevent="startHold"
            @touchend.prevent="endHold"
            @touchcancel.prevent="endHold"
            @mousedown="startHold"
            @mouseup="endHold"
            @mouseleave="endHold"
          >
            <q-icon :name="isHolding ? 'hourglass_top' : 'fingerprint'" size="20px" class="q-mr-xs shrink-0" />
            <span>{{ isHolding ? `${Math.round(holdProgress * 100)}% - ${t('challenge.holding')}` : t('challenge.holdButton') }}</span>
          </button>
        </div>
      </q-card-section>

      <!-- Compact Single-Row Action Bar -->
      <q-card-actions align="right" class="q-px-md q-pb-sm q-pt-none">
        <q-btn
          flat
          dense
          :label="t('challenge.cancel')"
          color="primary"
          v-close-popup
          @click="resetHold"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { IVehicleOption } from '../core/types/module';
import { t } from '../core/i18n/translations';

const props = defineProps<{
  modelValue: boolean;
  option: IVehicleOption | null;
  targetState: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', val: boolean): void;
  (e: 'authorized'): void;
}>();

const isHolding = ref(false);
const holdProgress = ref(0);
let holdTimer: any = null;
let progressInterval: any = null;

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const btnStyle = computed(() => {
  const pct = Math.round(holdProgress.value * 100);
  if (isHolding.value) {
    return {
      background: `linear-gradient(to right, #b71c1c ${pct}%, #d32f2f ${pct}%)`
    };
  }
  return {
    backgroundColor: '#c62828'
  };
});

watch(() => props.modelValue, (newVal) => {
  if (newVal) {
    resetHold();
  }
});

function startHold() {
  if (isHolding.value) return;
  isHolding.value = true;
  holdProgress.value = 0;

  const startTime = Date.now();
  const duration = 3000;

  progressInterval = setInterval(() => {
    const elapsed = Date.now() - startTime;
    holdProgress.value = Math.min(1.0, elapsed / duration);
  }, 50);

  holdTimer = setTimeout(() => {
    completeHold();
  }, duration);
}

function endHold() {
  if (!isHolding.value) return;
  resetHold();
}

function completeHold() {
  resetHold();
  emit('authorized');
  isOpen.value = false;
}

function resetHold() {
  isHolding.value = false;
  holdProgress.value = 0;
  if (holdTimer) {
    clearTimeout(holdTimer);
    holdTimer = null;
  }
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

function getOptionLocalizedTitle(opt: IVehicleOption | null): string {
  if (!opt) return '';
  const keyMap: Record<string, string> = {
    'f150_double_horn_honk': 'option.double_horn',
    'f150_enable_lane_change_assist': 'option.lane_change',
    'f150_enable_in_lane_repositioning': 'option.in_lane',
    'f150_bambi_mode_fog_high_beam': 'option.bambi_mode',
    'f150_turn_signal_tap_5': 'option.tap_count',
    'f150_disable_beltminder_driver': 'option.beltminder',
    'f150_disable_ese_engine_sound': 'option.ese_sound',
    'f150_offroad_screen_cluster': 'option.offroad_screen'
  };
  const translationKey = keyMap[opt.id];
  return translationKey ? t(translationKey) : opt.name || opt.id;
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

.hold-to-confirm-btn {
  width: 100%;
  height: 48px;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: transform 0.15s ease, background-color 0.2s ease;
  position: relative;
  overflow: hidden;
}

.hold-to-confirm-btn.is-holding {
  transform: scale(0.98);
}

.hold-to-confirm-btn:active {
  transform: scale(0.96);
}

.shrink-0 {
  flex-shrink: 0 !important;
}
</style>
