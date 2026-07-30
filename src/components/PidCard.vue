<template>
  <div class="pid-card-wrapper">
    <!-- Single Insertion Gap Line Indicator -->
    <div v-if="isDropTarget" class="drop-gap-indicator-line"></div>

    <q-card
      class="carfix-card pid-card q-mb-xs q-mb-sm-sm"
      :class="{ 'is-dragging': isDragging, 'has-drop-gap': isDropTarget }"
      :data-pid-id="pid.definition.id"
      flat
      borderless
      aria-label="PID Telemetry Card"
      @dragover="onDragOver"
      @dragleave="onDragLeave"
      @drop="onDrop"
    >
      <!-- Header Row: Only Drag Icon & Title -->
      <q-card-section class="q-pa-sm q-pa-sm-md q-pb-none">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center no-wrap q-gutter-x-xs ellipsis col">
            <!-- Dedicated Drag Handle Icon -->
            <q-icon
              name="drag_indicator"
              size="22px"
              color="grey-6"
              class="drag-handle flex-shrink-0"
              role="button"
              tabindex="0"
              draggable="true"
              aria-label="Drag handle to reorder PID card"
              @dragstart="onDragStart"
              @dragend="onDragEnd"
              @touchstart="onTouchStart"
              @touchmove="onTouchMove"
              @touchend="onTouchEnd"
              @touchcancel="onTouchEnd"
            >
              <q-tooltip>Drag to reorder</q-tooltip>
            </q-icon>

            <!-- Title Label & Availability Badge -->
            <span class="text-subtitle2 text-sm-subtitle1 text-weight-bold ellipsis text-no-wrap col">{{ pid.definition.name }}</span>
            <q-chip
              v-if="pid.isAvailable === false"
              dense
              size="xs"
              color="negative"
              text-color="white"
              icon="error_outline"
              class="q-ml-xs flex-shrink-0"
              aria-label="PID Unavailable on vehicle"
            >
              Unavailable
            </q-chip>
          </div>

          <div class="row items-center q-gutter-x-xs no-wrap flex-shrink-0">
            <!-- Remove PID Button (X) -->
            <q-btn
              flat
              round
              dense
              icon="close"
              color="negative"
              :aria-label="'Remove ' + pid.definition.name + ' from dashboard'"
              @click.stop="confirmRemove"
            >
              <q-tooltip>Remove PID</q-tooltip>
            </q-btn>
          </div>
        </div>
      </q-card-section>

      <!-- Body: Numeric Readout with Integrated Sparkline Behind/Beside Values -->
      <q-card-section class="q-pa-sm q-pa-sm-md q-pt-none">
        <div class="row items-baseline justify-between q-py-xs no-wrap relative-position overflow-hidden">
          <!-- Background Sparkline Layer strictly under title row -->
          <div v-if="pid.isAvailable !== false" class="sparkline-bg-overlay">
            <svg class="pid-svg-sparkline" viewBox="0 0 300 50" preserveAspectRatio="none" role="img" :aria-label="pid.definition.name + ' live sparkline graph'">
              <defs>
                <linearGradient :id="'grad-' + pid.definition.id" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" :stop-color="graphColor" stop-opacity="0.35" />
                  <stop offset="100%" :stop-color="graphColor" stop-opacity="0.02" />
                </linearGradient>
              </defs>

              <polygon :points="svgAreaPoints" :fill="'url(#grad-' + pid.definition.id + ')'" />
              <polyline :points="svgLinePoints" fill="none" :stroke="graphColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
          </div>

          <!-- Foreground Value & Min/Max Stats Row -->
          <div class="pid-value-container col relative-z1">
            <template v-if="pid.isAvailable === false">
              <span class="text-h4 text-sm-h3 text-weight-bolder text-grey-6">
                N/A
                <span class="text-subtitle1 text-sm-h5 text-negative text-weight-medium q-ml-xs">Unavailable</span>
              </span>
            </template>
            <template v-else-if="!store.isConnected">
              <span class="text-h4 text-sm-h3 text-weight-bolder text-grey-6">
                --
                <span class="text-subtitle1 text-sm-h5 text-grey-7 text-weight-medium q-ml-xs">{{ pid.definition.unit }}</span>
              </span>
            </template>
            <template v-else>
              <span class="text-h4 text-sm-h3 text-weight-bolder" :class="getValueColorClass()">
                {{ formatLocalizedNumber(pid.currentValue) }}
                <span class="text-subtitle1 text-sm-h5 text-grey-7 text-weight-medium q-ml-xs">{{ pid.definition.unit }}</span>
              </span>
            </template>
          </div>

          <div v-if="store.isConnected" class="text-right text-caption text-grey-6 no-wrap flex-shrink-0 q-ml-sm relative-z1">
            <div>Min: {{ pid.definition.minValue }} {{ pid.definition.unit }}</div>
            <div>Max: {{ pid.definition.maxValue }} {{ pid.definition.unit }}</div>
          </div>
          <div v-else class="text-right text-caption text-grey-6 no-wrap flex-shrink-0 q-ml-sm relative-z1">
            <div>Min: --</div>
            <div>Max: --</div>
          </div>
        </div>
      </q-card-section>

      <!-- Confirmation Dialog for Removal -->
      <q-dialog v-model="showConfirmModal" persistent role="dialog" aria-label="Confirm PID Removal">
        <q-card flat borderless class="carfix-card" style="min-width: 280px; max-width: 90vw;">
          <q-card-section class="row items-center q-pb-none">
            <q-icon name="warning" color="warning" size="28px" class="q-mr-sm" />
            <div class="text-subtitle1 text-weight-bold">Remove PID?</div>
          </q-card-section>

          <q-card-section class="q-pt-sm text-body2">
            Are you sure you want to remove <strong>{{ pid.definition.name }}</strong> from your dashboard?
          </q-card-section>

          <q-card-actions align="right">
            <q-btn flat label="Cancel" color="primary" v-close-popup />
            <q-btn label="Remove" color="negative" v-close-popup @click="executeRemove" />
          </q-card-actions>
        </q-card>
      </q-dialog>
    </q-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useCarFixStore } from '../stores/carfixStore';
import { IPidState } from '../core/pid/pidTypes';
import { formatLocalizedNumber } from '../core/utils/dateTimeUtils';

const store = useCarFixStore();

const props = defineProps<{
  pid: IPidState;
}>();

const emit = defineEmits<{
  (e: 'reorder', draggedId: string, targetId: string, position: 'before' | 'after'): void;
  (e: 'remove', pidId: string): void;
}>();

const isDragging = ref(false);
const isDropTarget = ref(false);
const showConfirmModal = ref(false);

function confirmRemove() {
  showConfirmModal.value = true;
}

function executeRemove() {
  emit('remove', props.pid.definition.id);
}

let currentDraggedPidId: string | null = null;

// Mouse Drag Events
function onDragStart(e: DragEvent) {
  isDragging.value = true;
  currentDraggedPidId = props.pid.definition.id;
  if (e.dataTransfer) {
    e.dataTransfer.setData('text/plain', props.pid.definition.id);
    e.dataTransfer.effectAllowed = 'move';
  }
}

function onDragOver(e: DragEvent) {
  e.preventDefault();
  const draggedId = e.dataTransfer?.getData('text/plain') || currentDraggedPidId;
  if (draggedId === props.pid.definition.id) {
    isDropTarget.value = false;
    return;
  }
  isDropTarget.value = true;
}

function onDragLeave() {
  isDropTarget.value = false;
}

function onDragEnd() {
  isDragging.value = false;
  isDropTarget.value = false;
  currentDraggedPidId = null;
}

function onDrop(e: DragEvent) {
  e.preventDefault();
  const draggedId = e.dataTransfer?.getData('text/plain') || currentDraggedPidId;

  isDragging.value = false;
  isDropTarget.value = false;
  currentDraggedPidId = null;

  if (draggedId && draggedId !== props.pid.definition.id) {
    emit('reorder', draggedId, props.pid.definition.id, 'before');
  }
}

// Mobile Touch Drag Events
let activeTouchTargetId: string | null = null;

function onTouchStart() {
  isDragging.value = true;
  currentDraggedPidId = props.pid.definition.id;
}

function onTouchMove(e: TouchEvent) {
  if (!isDragging.value) return;
  e.preventDefault();
  const touch = e.touches[0];
  const targetElement = document.elementFromPoint(touch.clientX, touch.clientY);
  const cardElement = targetElement?.closest('.pid-card') as HTMLElement;

  // Clear drop gap highlights across cards
  document.querySelectorAll('.drop-gap-indicator-line').forEach(el => el.remove());

  if (cardElement && cardElement.dataset.pidId && cardElement.dataset.pidId !== props.pid.definition.id) {
    activeTouchTargetId = cardElement.dataset.pidId;

    // Render single gap insertion line before target card
    const gapLine = document.createElement('div');
    gapLine.className = 'drop-gap-indicator-line';
    cardElement.parentElement?.insertBefore(gapLine, cardElement);
  }
}

function onTouchEnd() {
  if (isDragging.value) {
    isDragging.value = false;
    document.querySelectorAll('.drop-gap-indicator-line').forEach(el => el.remove());

    if (activeTouchTargetId && activeTouchTargetId !== props.pid.definition.id) {
      emit('reorder', props.pid.definition.id, activeTouchTargetId, 'before');
    }
  }
  activeTouchTargetId = null;
  isDropTarget.value = false;
  currentDraggedPidId = null;
}

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
  if (history.length === 0) return '0,55 300,55';

  const min = props.pid.definition.minValue;
  const max = props.pid.definition.maxValue;
  const range = max - min || 1;

  const points = history.map((pt, i) => {
    const x = (i / Math.max(1, history.length - 1)) * 300;
    const normalizedVal = Math.max(min, Math.min(max, pt.value));
    const y = 55 - ((normalizedVal - min) / range) * 50;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  return points.join(' ');
});

const svgAreaPoints = computed(() => {
  const line = svgLinePoints.value;
  return `0,58 ${line} 300,58`;
});
</script>

<style scoped lang="scss">
.pid-card-wrapper {
  position: relative;
}

/* Single High-Contrast In-Between Drop Gap Indicator Line */
:deep(.drop-gap-indicator-line) {
  height: 6px;
  background: #027be3;
  box-shadow: 0 0 10px #027be3, 0 0 4px #ffffff;
  border-radius: 3px;
  margin: 4px 0;
  animation: pulse-gap 1.2s infinite alternate;
}

@keyframes pulse-gap {
  from { opacity: 0.85; transform: scaleY(1); }
  to { opacity: 1; transform: scaleY(1.3); }
}

.pid-card {
  position: relative;
  transition: transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease;
  user-select: none;
}

.drag-handle {
  cursor: grab;
  touch-action: none !important;
}

.drag-handle:active {
  cursor: grabbing;
}

.pid-card.is-dragging {
  opacity: 0.3;
  border: 2px dashed var(--carfix-focus-ring) !important;
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
  width: 65%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
  opacity: 0.8;
}

.pid-svg-sparkline {
  width: 100%;
  height: 100%;
  overflow: visible;
}
</style>
