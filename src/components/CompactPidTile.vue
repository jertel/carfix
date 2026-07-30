<template>
  <q-card flat borderless class="carfix-card compact-pid-tile q-pa-xs">
    <!-- Header Row -->
    <div class="row items-center justify-between no-wrap q-px-xs">
      <div class="row items-center no-wrap q-gutter-x-xs ellipsis col">
        <span class="text-caption text-weight-bold ellipsis text-no-wrap col">{{ pid.definition.name }}</span>
        <span v-if="pid.isAvailable === false" class="text-caption text-negative text-weight-bold flex-shrink-0" style="font-size: 10px;" aria-label="PID Unavailable">N/A</span>
      </div>
    </div>

    <!-- Value Row & Sparkline Overlay (under title row) -->
    <div class="row items-baseline justify-between no-wrap q-px-xs q-mt-none relative-position overflow-hidden">
      <!-- Background Sparkline Layer strictly under title row -->
      <div v-if="pid.isAvailable !== false" class="sparkline-bg-overlay">
        <svg class="pid-svg-sparkline" viewBox="0 0 300 40" preserveAspectRatio="none" role="img" :aria-label="pid.definition.name + ' sparkline graph'">
          <defs>
            <linearGradient :id="'compact-grad-' + pid.definition.id" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" :stop-color="graphColor" stop-opacity="0.35" />
              <stop offset="100%" :stop-color="graphColor" stop-opacity="0.02" />
            </linearGradient>
          </defs>

          <polygon :points="svgAreaPoints" :fill="'url(#compact-grad-' + pid.definition.id + ')'" />
          <polyline :points="svgLinePoints" fill="none" :stroke="graphColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </div>

      <template v-if="pid.isAvailable === false">
        <span class="text-h6 text-sm-h5 text-weight-bolder text-grey-6 relative-z1">
          N/A
        </span>
      </template>
      <template v-else-if="!store.isConnected">
        <span class="text-h6 text-sm-h5 text-weight-bolder text-grey-6 relative-z1">
          --
          <span class="text-caption text-grey-7 text-weight-medium q-ml-xs">{{ pid.definition.unit }}</span>
        </span>
      </template>
      <template v-else>
        <span class="text-h6 text-sm-h5 text-weight-bolder relative-z1" :class="getValueColorClass()">
          {{ formatLocalizedNumber(pid.currentValue) }}
          <span class="text-caption text-grey-7 text-weight-medium q-ml-xs">{{ pid.definition.unit }}</span>
        </span>
      </template>

      <span v-if="store.isConnected" class="text-caption text-grey-6 text-weight-regular relative-z1" style="font-size: 10px;">
        {{ pid.definition.minValue }}/{{ pid.definition.maxValue }}
      </span>
      <span v-else class="text-caption text-grey-6 text-weight-regular relative-z1" style="font-size: 10px;">
        --/--
      </span>
    </div>
  </q-card>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useCarFixStore } from '../stores/carfixStore';
import { IPidState } from '../core/pid/pidTypes';
import { formatLocalizedNumber } from '../core/utils/dateTimeUtils';

const store = useCarFixStore();

const props = defineProps<{
  pid: IPidState;
}>();

function getValueColorClass(): string {
  const val = props.pid.currentValue;
  const def = props.pid.definition;
  if (def.criticalThreshold && val >= def.criticalThreshold) return 'text-negative';
  if (def.warningThreshold && val >= def.warningThreshold) return 'text-warning';
  return 'text-primary';
}

const graphColor = computed(() => {
  const val = props.pid.currentValue;
  const def = props.pid.definition;
  if (def.criticalThreshold && val >= def.criticalThreshold) return '#c62828';
  if (def.warningThreshold && val >= def.warningThreshold) return '#f57c00';
  return '#027be3';
});

const svgLinePoints = computed(() => {
  const history = props.pid.history;
  if (history.length === 0) return '0,45 300,45';

  const min = props.pid.definition.minValue;
  const max = props.pid.definition.maxValue;
  const range = max - min || 1;

  const points = history.map((pt, i) => {
    const x = (i / Math.max(1, history.length - 1)) * 300;
    const normalizedVal = Math.max(min, Math.min(max, pt.value));
    const y = 45 - ((normalizedVal - min) / range) * 40;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return points.join(' ');
});

const svgAreaPoints = computed(() => {
  const line = svgLinePoints.value;
  return `0,48 ${line} 300,48`;
});
</script>

<style scoped lang="scss">
.compact-pid-tile {
  min-height: 56px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  border-radius: 6px;
}

.flex-shrink-0 {
  flex-shrink: 0 !important;
}

.text-no-wrap {
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
}

.relative-position {
  position: relative;
}

.overflow-hidden {
  overflow: hidden;
}

.relative-z1 {
  position: relative;
  z-index: 1;
}

.sparkline-bg-overlay {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  width: 70%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.75;
}

.pid-svg-sparkline {
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
