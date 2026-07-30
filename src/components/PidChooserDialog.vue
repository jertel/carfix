<template>
  <q-dialog
    v-model="isOpen"
    persistent
    :maximized="$q.screen.xs"
    transition-show="slide-up"
    transition-hide="slide-down"
    role="dialog"
    aria-label="PID Selector Chooser"
  >
    <q-card class="carfix-card chooser-dialog" style="min-width: 300px; max-width: 650px; width: 100%;">
      <!-- Header Row with Fixed Right Close Button Alignment -->
      <q-card-section class="row items-center justify-between no-wrap q-pb-xs">
        <div class="col">
          <div class="text-h6 text-weight-bold ellipsis">Select Telemetry PIDs</div>
          <div class="text-caption text-grey-7 dark:text-grey-4 ellipsis">SAE J1979 & Vehicle Module PIDs</div>
        </div>
        <q-btn flat round dense icon="close" class="shrink-0" v-close-popup aria-label="Close PID chooser" />
      </q-card-section>

      <!-- Category Selector Dropdown & Search Bar -->
      <q-card-section class="q-py-xs">
        <div class="row q-col-gutter-xs q-col-gutter-sm-sm">
          <div class="col-12 col-sm-6 q-mb-xs q-mb-sm-none">
            <q-select
              v-model="selectedCategory"
              :options="categorySelectOptions"
              emit-value
              map-options
              outlined
              dense
              label="Filter by PID Source"
              aria-label="Filter PIDs by source category dropdown"
            />
          </div>
          <div class="col-12 col-sm-6">
            <q-input
              v-model="searchQuery"
              outlined
              dense
              placeholder="Search by name, command..."
              aria-label="Search available PIDs input"
            >
              <template #prepend>
                <q-icon name="search" />
              </template>
            </q-input>
          </div>
        </div>
      </q-card-section>

      <!-- List Sectioned by Source -->
      <q-card-section class="q-pt-xs scroll chooser-scroll-area">
        <!-- SAE Standard Section -->
        <div v-if="filteredSaePids.length > 0">
          <q-item-label header class="text-weight-bolder text-primary text-uppercase q-px-none q-py-xs">
            SAE J1979 Universal Standard PIDs ({{ filteredSaePids.length }})
          </q-item-label>
          <q-list separator class="rounded-borders q-mb-md">
            <q-item v-for="pidDef in filteredSaePids" :key="pidDef.id" class="q-py-sm q-px-xs q-px-sm-md">
              <q-item-section>
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-weight-bold text-subtitle2">{{ pidDef.name }}</span>
                  <q-badge
                    :color="$q.dark.isActive ? 'indigo-9' : 'blue-1'"
                    :text-color="$q.dark.isActive ? 'white' : 'indigo-10'"
                    class="text-caption text-weight-bold q-px-xs"
                  >
                    SAE {{ pidDef.command }}
                  </q-badge>
                </div>
                <q-item-label caption>
                  Range: {{ pidDef.minValue }} to {{ pidDef.maxValue }} {{ pidDef.unit }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  v-if="isPidActive(pidDef.id)"
                  color="positive"
                  icon="check_circle"
                  label="Added"
                  flat
                  dense
                  style="min-width: 85px;"
                  aria-label="PID already added to dashboard"
                  :disable="true"
                />
                <q-btn
                  v-else
                  color="primary"
                  icon="add_circle"
                  label="Add PID"
                  outline
                  dense
                  style="min-width: 85px;"
                  :aria-label="'Add ' + pidDef.name + ' to dashboard'"
                  @click="onAddPid(pidDef.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <!-- Proprietary OEM Section -->
        <div v-if="filteredProprietaryPids.length > 0">
          <q-item-label header class="text-weight-bolder text-accent text-uppercase q-px-none q-py-xs">
            {{ moduleName }} Proprietary PIDs ({{ filteredProprietaryPids.length }})
          </q-item-label>
          <q-list separator class="rounded-borders">
            <q-item v-for="pidDef in filteredProprietaryPids" :key="pidDef.id" class="q-py-sm q-px-xs q-px-sm-md">
              <q-item-section>
                <div class="row items-center q-gutter-x-xs">
                  <span class="text-weight-bold text-subtitle2">{{ pidDef.name }}</span>
                  <q-badge
                    :color="$q.dark.isActive ? 'purple-9' : 'purple-1'"
                    :text-color="$q.dark.isActive ? 'white' : 'purple-10'"
                    class="text-caption text-weight-bold q-px-xs"
                  >
                    DID {{ pidDef.command }}
                  </q-badge>
                </div>
                <q-item-label caption>
                  Range: {{ pidDef.minValue }} to {{ pidDef.maxValue }} {{ pidDef.unit }}
                </q-item-label>
              </q-item-section>

              <q-item-section side>
                <q-btn
                  v-if="isPidActive(pidDef.id)"
                  color="positive"
                  icon="check_circle"
                  label="Added"
                  flat
                  dense
                  style="min-width: 85px;"
                  aria-label="PID already added to dashboard"
                  :disable="true"
                />
                <q-btn
                  v-else
                  color="primary"
                  icon="add_circle"
                  label="Add PID"
                  outline
                  dense
                  style="min-width: 85px;"
                  :aria-label="'Add ' + pidDef.name + ' to dashboard'"
                  @click="onAddPid(pidDef.id)"
                />
              </q-item-section>
            </q-item>
          </q-list>
        </div>

        <div v-if="filteredSaePids.length === 0 && filteredProprietaryPids.length === 0" class="text-center q-pa-lg text-grey-7">
          <q-icon name="search_off" size="48px" />
          <div class="text-subtitle1 q-mt-sm">No PIDs found matching search.</div>
        </div>
      </q-card-section>

      <q-card-actions align="right" class="q-pa-md">
        <q-btn color="primary" label="Done" class="full-width-xs" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useQuasar } from 'quasar';
import { useCarFixStore } from '../stores/carfixStore';
import { IPidDefinition } from '../core/pid/pidTypes';

const $q = useQuasar();
const store = useCarFixStore();
const searchQuery = ref('');
const selectedCategory = ref('ALL');

const props = defineProps<{
  modelValue: boolean;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void;
}>();

const isOpen = computed({
  get: () => props.modelValue,
  set: (val: boolean) => emit('update:modelValue', val)
});

const moduleName = computed(() => {
  return store.activeModule?.name || 'Ford OEM';
});

const categorySelectOptions = computed(() => [
  { label: 'All PIDs & Sources', value: 'ALL' },
  { label: 'SAE Universal Standard', value: 'SAE' },
  { label: `${moduleName.value} Proprietary`, value: 'PROPRIETARY' }
]);

const filteredSaePids = computed(() => {
  if (selectedCategory.value === 'PROPRIETARY') return [];
  const query = searchQuery.value.toLowerCase().trim();
  return store.availablePids.filter((p: IPidDefinition) => {
    const isSae = p.source === 'SAE' || !p.source;
    if (!isSae) return false;
    if (!query) return true;
    return p.name.toLowerCase().includes(query) || p.command.toLowerCase().includes(query) || p.unit.toLowerCase().includes(query);
  });
});

const filteredProprietaryPids = computed(() => {
  if (selectedCategory.value === 'SAE') return [];
  const query = searchQuery.value.toLowerCase().trim();
  return store.availablePids.filter((p: IPidDefinition) => {
    const isProp = p.source === 'PROPRIETARY';
    if (!isProp) return false;
    if (!query) return true;
    return p.name.toLowerCase().includes(query) || p.command.toLowerCase().includes(query) || p.unit.toLowerCase().includes(query);
  });
});

function isPidActive(id: string): boolean {
  return store.pids.some(p => p.definition.id === id);
}

function onAddPid(id: string) {
  store.addPidToDashboard(id);
}
</script>

<style scoped lang="scss">
.chooser-dialog {
  max-height: 85vh;
  display: flex;
  flex-direction: column;
}

.chooser-scroll-area {
  flex: 1;
  max-height: 60vh;
}

.shrink-0 {
  flex-shrink: 0 !important;
}

@media (max-width: 599px) {
  .chooser-dialog {
    max-height: 100vh;
  }
  .chooser-scroll-area {
    max-height: 70vh;
  }
  .full-width-xs {
    width: 100%;
  }
}
</style>
