<template>
  <q-dialog :model-value="modelValue" persistent role="dialog" aria-label="Line Hex History and Restore" @update:model-value="val => $emit('update:modelValue', val)">
    <q-card flat borderless class="carfix-card q-pa-md" style="min-width: 320px; max-width: 500px; width: 100%;">
      <!-- Header -->
      <q-card-section class="q-pb-none q-pt-xs">
        <div class="row items-center justify-between no-wrap">
          <div class="row items-center q-gutter-x-xs no-wrap col">
            <q-icon name="history" color="primary" size="24px" class="shrink-0" />
            <div class="text-subtitle1 text-weight-bold ellipsis col">
              {{ t('history.title') }}
            </div>
          </div>
          <q-btn flat round dense icon="close" class="shrink-0" v-close-popup />
        </div>

        <div v-if="option" class="text-caption text-grey-7 dark:text-grey-4 q-mt-xs font-mono">
          Target: <strong>{{ option.targetAddress }}</strong> | {{ option.name }}
        </div>
      </q-card-section>

      <!-- History Entries List -->
      <q-card-section class="q-py-md">
        <div v-if="historyEntries.length > 0" class="q-gutter-y-sm max-history-height">
          <div
            v-for="(entry, index) in historyEntries"
            :key="index"
            class="q-pa-sm carfix-code-block rounded-borders cursor-pointer"
            tabindex="0"
            role="button"
            :aria-expanded="isExpanded(index)"
            @click="toggleExpand(index)"
            @keyup.enter="toggleExpand(index)"
          >
            <div class="row items-center justify-between no-wrap">
              <div class="col">
                <div class="text-caption text-grey-7 dark:text-grey-4 text-weight-medium row items-center q-gutter-x-2xs">
                  <span>{{ formatDateTime(entry.timestampISO) }}</span>
                  <q-icon
                    :name="isExpanded(index) ? 'expand_less' : 'expand_more'"
                    size="16px"
                    class="text-grey-6"
                  />
                </div>
                <div class="text-caption font-mono text-weight-bold text-primary q-mt-2xs hex-wrap">
                  {{ entry.hexValue }}
                </div>
              </div>

              <q-btn
                flat
                dense
                size="sm"
                color="primary"
                icon="restore"
                :label="t('history.restore')"
                :aria-label="`Restore hex ${entry.hexValue} for ${option?.targetAddress}`"
                :disable="store.isWriting || !store.isConnected || !store.isVinMatched"
                @click.stop="requestRestoreEntry(entry.hexValue)"
              />
            </div>

            <!-- Expanded Block Lines View -->
            <div v-if="isExpanded(index)" class="q-mt-xs q-pt-xs border-top-grey q-gutter-y-2xs">
              <div class="text-caption text-grey-6 dark:text-grey-4 text-weight-bold q-mb-2xs">
                {{ t('history.blockLinesTitle') || 'Block Lines:' }}
              </div>
              <div v-if="entry.blockLines && entry.blockLines.length > 0" class="q-gutter-y-2xs">
                <div
                  v-for="bLine in entry.blockLines"
                  :key="bLine.address"
                  class="row items-center justify-between text-caption font-mono"
                  :class="{ 'text-weight-bold text-primary': bLine.address === option?.targetAddress }"
                >
                  <span>{{ bLine.address }}:</span>
                  <span>{{ bLine.hexValue }}</span>
                </div>
              </div>
              <div v-else class="text-caption font-mono text-grey-6 dark:text-grey-4">
                <span>{{ option?.targetAddress }}:</span> <span>{{ entry.hexValue }}</span>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="text-center q-pa-lg text-grey-6 dark:text-grey-4">
          <q-icon name="history_toggle_off" size="40px" class="q-mb-xs" />
          <div class="text-caption">{{ t('history.empty') }}</div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pt-none">
        <q-btn flat label="Close" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>

  <!-- Restore Confirmation Challenge Popup -->
  <WriteChallengeDialog
    v-model="isChallengeOpen"
    :option="option"
    :target-state="false"
    @authorized="onRestoreAuthorized"
  />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useCarFixStore } from '../stores/carfixStore';
import { IVehicleOption } from '../core/types/module';
import { backupManager } from '../core/safety/backupManager';
import { formatLocalizedDateTime, getSystemTimezone } from '../core/utils/dateTimeUtils';
import { t } from '../core/i18n/translations';
import WriteChallengeDialog from './WriteChallengeDialog.vue';

const props = defineProps<{
  modelValue: boolean;
  option: IVehicleOption | null;
}>();

const emit = defineEmits(['update:modelValue', 'restored']);

const store = useCarFixStore();
const $q = useQuasar();
const isChallengeOpen = ref(false);
const selectedRestoreHex = ref('');
const expandedIndexes = ref<Set<number>>(new Set());

const historyEntries = computed(() => {
  if (!props.option) return [];
  return backupManager.getLineHistory(props.option.targetAddress);
});

function isExpanded(index: number): boolean {
  return expandedIndexes.value.has(index);
}

function toggleExpand(index: number) {
  if (expandedIndexes.value.has(index)) {
    expandedIndexes.value.delete(index);
  } else {
    expandedIndexes.value.add(index);
  }
}

function formatDateTime(iso: string): string {
  return formatLocalizedDateTime(iso, 'en-US', getSystemTimezone());
}

function requestRestoreEntry(hexValue: string) {
  selectedRestoreHex.value = hexValue;
  isChallengeOpen.value = true;
}

async function onRestoreAuthorized() {
  if (!props.option || !selectedRestoreHex.value) return;
  const targetHex = selectedRestoreHex.value;
  const ok = await store.restoreOptionLine(props.option, targetHex);

  if (ok) {
    $q.notify({
      type: 'positive',
      message: t('history.restoreSuccess'),
      caption: `Restored ${props.option.targetAddress} to ${targetHex}`,
      icon: 'check_circle',
      timeout: 4000
    });
    emit('restored');
  } else {
    $q.notify({
      type: 'negative',
      message: t('history.restoreError'),
      icon: 'error',
      timeout: 5000
    });
  }
}
</script>

<style scoped lang="scss">
.shrink-0 {
  flex-shrink: 0 !important;
}

.max-history-height {
  max-height: 320px;
  overflow-y: auto;
}

.hex-wrap {
  word-break: break-all !important;
  overflow-wrap: break-word !important;
}

.font-mono {
  font-family: monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo;
}

.border-top-grey {
  border-top: 1px dashed rgba(128, 128, 128, 0.3);
}
</style>
