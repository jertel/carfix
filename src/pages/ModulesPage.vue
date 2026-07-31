<template>
  <q-page class="q-pa-xs q-pa-sm-md">
    <div class="row justify-center">
      <div class="col-12 col-md-10 col-lg-9">
        <!-- Top Navigation Sub-Tabs: Modules and Configure -->
        <q-tabs
          v-model="activeModulesSubTab"
          dense
          active-color="primary"
          indicator-color="primary"
          align="justify"
          class="text-caption carfix-card q-mb-md"
          role="tablist"
          aria-label="Modules View Categories"
        >
          <q-tab name="modules" icon="memory" :label="t('modulesPage.modulesTab')" aria-label="Modules List Tab" />
          <q-tab name="configure" icon="tune" :label="t('modulesPage.configureTab')" aria-label="Configure Options Tab" />
        </q-tabs>

        <!-- Tab Panels Container -->
        <q-tab-panels v-model="activeModulesSubTab" animated class="bg-transparent">
          <!-- TAB 1: Modules List (Original Tabular View) -->
          <q-tab-panel name="modules" class="q-pa-none">
            <div v-if="sortedModules.length > 0" class="carfix-card rounded-borders overflow-hidden" role="table" aria-label="Vehicle Modules List">
              <!-- Table Header Row -->
              <div
                class="row items-center q-pa-sm carfix-code-block text-weight-bold text-caption border-bottom-subtle"
                role="row"
              >
                <div class="col-4 col-sm-3 row items-center q-gutter-x-xs" role="columnheader">
                  <span>{{ t('modules.abbreviation') }}</span>
                </div>
                <div class="col-3 col-sm-3 row items-center" role="columnheader">
                  <span>{{ t('modules.canId') }}</span>
                </div>
                <div class="col-5 col-sm-6 row items-center justify-between no-wrap" role="columnheader">
                  <span>{{ t('modules.softwareVersion') }}</span>
                  <span class="text-caption text-weight-normal text-grey-6 gt-xs">{{ t('modules.additionalInfo') }}</span>
                </div>
              </div>

              <!-- Table Rows -->
              <div role="rowgroup">
                <div
                  v-for="mod in sortedModules"
                  :key="mod.id"
                  class="module-table-row border-bottom-subtle"
                >
                  <!-- Primary Row (Clickable) -->
                  <div
                    class="row items-center q-pa-sm cursor-pointer module-row-interactive"
                    role="button"
                    tabindex="0"
                    :aria-expanded="isExpanded(mod.id)"
                    :aria-label="`${getModuleAbbrevFromInfo(mod)} (0x${mod.id}) - ${mod.softwareVersion || mod.partNumber || mod.currentVersion || t('modules.noSoftwareVersion')}. Click for additional information.`"
                    @click="toggleModule(mod.id)"
                    @keydown.enter.prevent="toggleModule(mod.id)"
                    @keydown.space.prevent="toggleModule(mod.id)"
                  >
                    <!-- Column 1: Module Abbreviation -->
                    <div class="col-4 col-sm-3 row items-center no-wrap ellipsis">
                      <span class="text-subtitle2 text-weight-bold font-mono ellipsis">
                        {{ getModuleAbbrevFromInfo(mod) }}
                      </span>
                    </div>

                    <!-- Column 2: Module Code / CAN ID -->
                    <div class="col-3 col-sm-3 row items-center">
                      <q-badge color="secondary" class="text-caption font-mono shrink-0">
                        0x{{ mod.id }}
                      </q-badge>
                    </div>

                    <!-- Column 3: Software Version + Expand Icon -->
                    <div class="col-5 col-sm-6 row items-center justify-between no-wrap q-pl-xs">
                      <span class="text-caption font-mono text-weight-medium text-primary version-text-ellipsis">
                        {{ mod.softwareVersion || mod.partNumber || mod.currentVersion || t('modules.noSoftwareVersion') }}
                      </span>
                      <q-icon
                        :name="isExpanded(mod.id) ? 'expand_less' : 'expand_more'"
                        size="22px"
                        color="grey-6"
                        class="shrink-0 q-ml-xs"
                      />
                    </div>
                  </div>

                  <!-- Expanded Details Section -->
                  <q-slide-transition>
                    <div v-show="isExpanded(mod.id)" class="q-pa-md carfix-code-block border-top-subtle">
                      <div class="text-subtitle2 text-weight-bold text-primary q-mb-sm row items-center q-gutter-x-xs">
                        <q-icon name="info" size="18px" />
                        <span>{{ t('modules.additionalInfo') }}</span>
                      </div>

                      <div class="row q-col-gutter-sm text-caption font-mono">
                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.fullName') }}:</span>
                          <span class="q-ml-xs text-weight-bold text-wrap-break">{{ mod.name }}</span>
                        </div>

                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.canId') }}:</span>
                          <span class="q-ml-xs text-weight-bold">0x{{ mod.id }}</span>
                        </div>

                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.partNumber') }}:</span>
                          <span class="q-ml-xs text-weight-bold text-wrap-break">{{ mod.partNumber || mod.currentVersion || t('modules.noSoftwareVersion') }}</span>
                        </div>

                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.softwareVersion') }}:</span>
                          <span class="q-ml-xs text-weight-bold text-wrap-break">{{ mod.softwareVersion || t('modules.noSoftwareVersion') }}</span>
                        </div>

                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.did') }}:</span>
                          <span class="q-ml-xs text-weight-bold">{{ mod.partNumberDid || 'F113' }}</span>
                        </div>

                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.category') }}:</span>
                          <span class="q-ml-xs text-weight-bold">{{ mod.category }}</span>
                        </div>

                        <div class="col-12 col-sm-6">
                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">{{ t('modules.status') }}:</span>
                          <span class="q-ml-xs text-weight-bold">{{ mod.status }}</span>
                        </div>
                      </div>

                      <!-- Export As-Built Action Button -->
                      <div class="q-mt-md row items-center justify-start">
                        <q-btn
                          color="primary"
                          outline
                          dense
                          class="q-px-sm font-mono text-caption"
                          icon="download"
                          :label="t('modules.exportAsBuilt')"
                          :loading="exportingModuleId === mod.id"
                          :aria-label="`Export As-Built data for ${getModuleAbbrevFromInfo(mod)} 0x${mod.id}`"
                          @click.stop="handleExportModule(mod.id)"
                        />
                      </div>
                    </div>
                  </q-slide-transition>
                </div>
              </div>
            </div>

            <!-- Modules Empty State -->
            <div v-else class="text-center q-pa-xl carfix-card rounded-borders">
              <q-icon name="memory" size="64px" color="grey-5" />
              <div class="text-h6 text-grey-7 dark:text-grey-4 q-mt-md">{{ t('modules.emptyState') }}</div>
              <p class="text-caption text-grey-6 q-mt-xs">{{ t('modules.emptyStateDesc') }}</p>
            </div>
          </q-tab-panel>

          <!-- TAB 2: Configure (Vehicle Options Catalog) -->
          <q-tab-panel name="configure" class="q-pa-none">
            <!-- VIN Safety Warning Banner for Mismatched Vehicle Profiles -->
            <q-banner v-if="store.isConnected && !store.isVinMatched" rounded class="bg-negative text-white q-mb-md">
              <template #avatar>
                <q-icon name="block" size="28px" />
              </template>

              <div class="text-subtitle1 text-weight-bold">Vehicle Safety Lock Active</div>
              <div class="text-caption">
                Connected VIN ({{ store.connectedVin }}) does not match the <strong>{{ store.activeModule?.name }}</strong> profile. Configuration options are disabled to prevent vehicle electrical damage.
              </div>
            </q-banner>

            <!-- Banner when Vehicle Engine is Running -->
            <q-banner v-if="store.isEngineRunning" class="bg-warning text-dark q-mb-md rounded-borders shadow-1" dense>
              <template v-slot:avatar>
                <q-icon name="warning" color="dark" size="22px" />
              </template>
              <span class="text-weight-medium">{{ t('options.engineRunningBanner') }}</span>
            </q-banner>

            <!-- Vehicle Options Search Input Bar -->
            <div v-if="store.isConnected && store.isVinMatched && store.availableOptions.length > 0" class="q-mb-md">
              <q-input
                v-model="optionSearchQuery"
                dense
                outlined
                clearable
                class="carfix-card rounded-borders font-sans"
                :placeholder="t('options.searchPlaceholder')"
                :aria-label="t('options.searchPlaceholder')"
              >
                <template #prepend>
                  <q-icon name="search" color="primary" size="20px" />
                </template>
              </q-input>
            </div>

            <!-- Available Options Expandable List -->
            <div v-if="groupedAndSortedOptions.length > 0" class="q-pa-xs">
              <q-list class="rounded-borders">
                <q-card
                  v-for="item in groupedAndSortedOptions"
                  :key="item.id"
                  flat
                  borderless
                  class="carfix-card q-mb-sm rounded-borders overflow-hidden"
                >
                  <!-- CASE 1: OPTION GROUP -->
                  <template v-if="item.isGroup">
                    <q-expansion-item
                      group="options-group"
                      header-class="q-py-sm q-px-md"
                      :aria-label="'Option Group ' + item.groupName"
                    >
                      <template #header>
                        <q-item-section class="col">
                          <div class="row items-center justify-between no-wrap col q-gutter-x-xs">
                            <div class="row items-center q-gutter-x-xs no-wrap col">
                              <q-icon name="folder_special" color="primary" size="20px" class="shrink-0 q-mr-xs" />
                              <span class="text-subtitle1 text-weight-bold option-title-wrap col">{{ item.groupName }}</span>

                              <!-- Group Star Icons based on History State -->
                              <q-icon
                                v-if="getGroupHistoryState(item) === 'ALL'"
                                name="star"
                                color="warning"
                                size="20px"
                                class="shrink-0 cursor-pointer"
                                aria-label="All options in group modified"
                              >
                                <q-tooltip class="text-caption shadow-2">All options in group modified (saved history)</q-tooltip>
                              </q-icon>

                              <q-icon
                                v-else-if="getGroupHistoryState(item) === 'SOME'"
                                name="star_border"
                                color="warning"
                                size="20px"
                                class="shrink-0 cursor-pointer"
                                aria-label="Some options in group modified"
                              >
                                <q-tooltip class="text-caption shadow-2">Some options in group modified (saved history)</q-tooltip>
                              </q-icon>
                            </div>

                            <span class="text-caption text-grey-6 dark:text-grey-4 shrink-0 font-mono">
                              ({{ item.options.length }} Options)
                            </span>
                          </div>
                        </q-item-section>
                      </template>

                      <!-- Group Content: Nested Collapsed Options List -->
                      <q-card-section class="q-pa-xs border-t-muted bg-transparent">
                        <q-list class="q-gutter-y-xs">
                          <q-card
                            v-for="subOpt in item.options"
                            :key="subOpt.id"
                            flat
                            borderless
                            class="carfix-card rounded-borders overflow-hidden q-mb-xs"
                          >
                            <q-expansion-item
                              group="sub-options-group"
                              header-class="q-py-xs q-px-sm"
                              :aria-label="getOptionTitle(subOpt)"
                            >
                              <template #header>
                                <q-item-section class="col">
                                  <div class="row items-center q-gutter-x-xs no-wrap col">
                                    <span class="text-body2 text-weight-bold option-title-wrap">{{ getOptionTitle(subOpt) }}</span>

                                    <q-icon
                                      v-if="hasHistory(subOpt)"
                                      name="star"
                                      color="warning"
                                      size="18px"
                                      class="shrink-0 cursor-pointer"
                                      :aria-label="t('options.hasHistoryTooltip')"
                                    >
                                      <q-tooltip class="text-caption shadow-2">
                                        {{ t('options.hasHistoryTooltip') }}
                                      </q-tooltip>
                                    </q-icon>
                                  </div>
                                </q-item-section>
                              </template>

                              <q-card-section class="q-px-sm q-pb-sm q-pt-none border-t-muted">
                                <div class="row items-center justify-between no-wrap q-mt-xs q-mb-xs q-gutter-x-sm">
                                  <div class="text-caption text-grey-6 dark:text-grey-4 font-mono col">
                                    Target: {{ subOpt.targetAddress }} | Module: {{ getModuleAbbreviation(subOpt.primaryModule) }}
                                  </div>

                                  <q-icon
                                    :name="getSafetyIcon(subOpt.safetyLevel)"
                                    :color="getSafetyIconColor(subOpt.safetyLevel)"
                                    size="18px"
                                    class="shrink-0 cursor-pointer"
                                    :aria-label="`Safety Risk: ${subOpt.safetyLevel}`"
                                  >
                                    <q-tooltip class="text-caption shadow-2">
                                      {{ getSafetyTooltip(subOpt.safetyLevel) }}
                                    </q-tooltip>
                                  </q-icon>
                                </div>

                                <div class="text-caption text-grey-7 dark:text-grey-4 q-mb-sm option-desc-wrap">
                                  {{ getOptionDescription(subOpt) }}
                                </div>

                                <div v-if="!store.isOptionFirmwareSatisfied(subOpt)" class="q-mb-sm q-pa-xs rounded-borders bg-warning text-dark text-caption row items-center q-gutter-x-xs font-sans">
                                  <q-icon name="warning" color="dark" size="16px" class="shrink-0" />
                                  <span>Firmware requirement unmet: {{ store.getOptionFirmwareMissingReason(subOpt) }}</span>
                                </div>

                                <div v-if="store.optionLoadingMap[subOpt.id]" class="row items-center q-gutter-x-sm text-caption text-primary q-py-sm">
                                  <q-spinner-dots size="20px" color="primary" />
                                  <span class="text-italic font-mono">Reading setting from vehicle ECU...</span>
                                </div>

                                <template v-else-if="isOptionRead(subOpt)">
                                  <div class="row items-center justify-between no-wrap q-gutter-x-sm">
                                    <div class="q-pa-xs carfix-code-block rounded-borders col">
                                      <div class="row items-center justify-between no-wrap font-mono text-caption">
                                        <div class="row items-center q-gutter-x-xs font-mono text-caption col">
                                          <span class="text-grey-7 dark:text-grey-4 text-weight-medium">Current Hex:</span>
                                          <strong class="text-primary font-mono text-weight-bold">
                                            {{ store.moduleData[subOpt.targetAddress] }}
                                          </strong>
                                        </div>

                                        <q-btn
                                          v-if="store.isOptionFirmwareSatisfied(subOpt)"
                                          flat
                                          round
                                          dense
                                          color="warning"
                                          icon="history"
                                          size="sm"
                                          class="shrink-0"
                                          :aria-label="'View Line History for ' + subOpt.targetAddress"
                                          @click="openHistory(subOpt)"
                                        >
                                          <q-tooltip class="text-caption shadow-2">
                                            View Line Hex History
                                          </q-tooltip>
                                        </q-btn>
                                      </div>
                                    </div>

                                    <q-toggle
                                      v-if="store.isOptionFirmwareSatisfied(subOpt)"
                                      :model-value="isOptionEnabled(subOpt)"
                                      color="positive"
                                      size="md"
                                      class="shrink-0"
                                      :aria-label="'Toggle ' + getOptionTitle(subOpt)"
                                      :disabled="!store.isVinMatched || store.isEngineRunning"
                                      @update:model-value="(val) => requestOptionToggle(subOpt, val)"
                                    />
                                  </div>
                                </template>

                                <div v-else class="row items-center justify-end q-py-xs">
                                  <q-btn
                                    dense
                                    outline
                                    color="primary"
                                    icon="refresh"
                                    :label="t('options.readSetting')"
                                    class="text-caption font-mono"
                                    :loading="store.optionLoadingMap[subOpt.id]"
                                    :disabled="store.isEngineRunning"
                                    @click="onOptionRead(subOpt)"
                                  />
                                </div>
                              </q-card-section>
                            </q-expansion-item>
                          </q-card>
                        </q-list>
                      </q-card-section>
                    </q-expansion-item>
                  </template>

                  <!-- CASE 2: SINGLE STANDALONE OPTION -->
                  <template v-else>
                    <q-expansion-item
                      group="standalone-options-group"
                      header-class="q-py-sm q-px-md"
                      :aria-label="getOptionTitle(item)"
                    >
                      <template #header>
                        <q-item-section class="col">
                          <div class="row items-center q-gutter-x-xs no-wrap col">
                            <span class="text-subtitle1 text-weight-bold option-title-wrap">{{ getOptionTitle(item) }}</span>

                            <q-icon
                              v-if="hasHistory(item)"
                              name="star"
                              color="warning"
                              size="18px"
                              class="shrink-0 cursor-pointer"
                              :aria-label="t('options.hasHistoryTooltip')"
                            >
                              <q-tooltip class="text-caption shadow-2">
                                {{ t('options.hasHistoryTooltip') }}
                              </q-tooltip>
                            </q-icon>
                          </div>
                        </q-item-section>
                      </template>

                      <q-card-section class="q-px-md q-pb-md q-pt-none border-t-muted">
                        <div class="row items-center justify-between no-wrap q-mt-xs q-mb-xs q-gutter-x-sm">
                          <div class="text-caption text-grey-6 dark:text-grey-4 font-mono col">
                            Target: {{ item.targetAddress }} | Module: {{ getModuleAbbreviation(item.primaryModule) }}
                          </div>

                          <q-icon
                            :name="getSafetyIcon(item.safetyLevel)"
                            :color="getSafetyIconColor(item.safetyLevel)"
                            size="18px"
                            class="shrink-0 cursor-pointer"
                            :aria-label="`Safety Risk: ${item.safetyLevel}`"
                          >
                            <q-tooltip class="text-caption shadow-2">
                              {{ getSafetyTooltip(item.safetyLevel) }}
                            </q-tooltip>
                          </q-icon>
                        </div>

                        <div class="text-caption text-grey-7 dark:text-grey-4 q-mb-sm option-desc-wrap">
                          {{ getOptionDescription(item) }}
                        </div>

                        <div v-if="!store.isOptionFirmwareSatisfied(item)" class="q-mb-sm q-pa-xs rounded-borders bg-warning text-dark text-caption row items-center q-gutter-x-xs font-sans">
                          <q-icon name="warning" color="dark" size="16px" class="shrink-0" />
                          <span>Firmware requirement unmet: {{ store.getOptionFirmwareMissingReason(item) }}</span>
                        </div>

                        <div v-if="store.optionLoadingMap[item.id]" class="row items-center q-gutter-x-sm text-caption text-primary q-py-sm">
                          <q-spinner-dots size="20px" color="primary" />
                          <span class="text-italic font-mono">Reading setting from vehicle ECU...</span>
                        </div>

                        <template v-else-if="isOptionRead(item)">
                          <div class="row items-center justify-between no-wrap q-gutter-x-sm">
                            <div class="q-pa-xs carfix-code-block rounded-borders col">
                              <div class="row items-center justify-between no-wrap font-mono text-caption">
                                <div class="row items-center q-gutter-x-xs font-mono text-caption col">
                                  <span class="text-grey-7 dark:text-grey-4 text-weight-medium">Current Hex:</span>
                                  <strong class="text-primary font-mono text-weight-bold">
                                    {{ store.moduleData[item.targetAddress] }}
                                  </strong>
                                </div>

                                <q-btn
                                  v-if="store.isOptionFirmwareSatisfied(item)"
                                  flat
                                  round
                                  dense
                                  color="warning"
                                  icon="history"
                                  size="sm"
                                  class="shrink-0"
                                  :aria-label="'View Line History for ' + item.targetAddress"
                                  @click="openHistory(item)"
                                >
                                  <q-tooltip class="text-caption shadow-2">
                                    View Line Hex History
                                  </q-tooltip>
                                </q-btn>
                              </div>
                            </div>

                            <q-toggle
                              v-if="store.isOptionFirmwareSatisfied(item)"
                              :model-value="isOptionEnabled(item)"
                              color="positive"
                              size="md"
                              class="shrink-0"
                              :aria-label="'Toggle ' + getOptionTitle(item)"
                              :disabled="!store.isVinMatched || store.isEngineRunning"
                              @update:model-value="(val) => requestOptionToggle(item, val)"
                            />
                          </div>
                        </template>

                        <div v-else class="row items-center justify-end q-py-xs">
                          <q-btn
                            dense
                            outline
                            color="primary"
                            icon="refresh"
                            :label="t('options.readSetting')"
                            class="text-caption font-mono"
                            :loading="store.optionLoadingMap[item.id]"
                            :disabled="store.isEngineRunning"
                            @click="onOptionRead(item)"
                          />
                        </div>
                      </q-card-section>
                    </q-expansion-item>
                  </template>
                </q-card>
              </q-list>
            </div>

            <!-- Empty Search State -->
            <div v-else-if="optionSearchQuery" class="text-center q-pa-lg carfix-card rounded-borders q-mt-md">
              <q-icon name="search_off" size="48px" color="grey-5" />
              <div class="text-subtitle1 text-grey-7 dark:text-grey-4 q-mt-sm">{{ t('options.noSearchMatches') }}</div>
              <p class="text-caption text-grey-6">{{ t('options.noSearchMatchesDesc') }}</p>
              <q-btn
                flat
                color="primary"
                dense
                class="q-mt-xs font-sans"
                :label="t('options.clearSearch')"
                @click="optionSearchQuery = ''"
              />
            </div>
          </q-tab-panel>
        </q-tab-panels>

        <!-- Confirmation Hold-to-Authorize Write Challenge Dialog -->
        <WriteChallengeDialog
          v-model="isChallengeOpen"
          :option="selectedOption"
          :target-state="selectedTargetState"
          @authorized="onChallengeAuthorized"
        />

        <!-- Line Hex History Modal Dialog -->
        <LineHistoryDialog
          v-model="isHistoryDialogOpen"
          :option="historyOption"
          @restored="onLineRestored"
        />

        <!-- Write Result Notification Dialog -->
        <q-dialog v-model="showResultDialog">
          <q-card style="min-width: 320px;" class="carfix-card">
            <q-card-section class="row items-center">
              <q-avatar
                :icon="writeResult?.success ? 'check_circle' : 'error'"
                :color="writeResult?.success ? 'positive' : 'negative'"
                text-color="white"
              />
              <div class="q-ml-sm">
                <div class="text-h6 font-sans">
                  {{ writeResult?.success ? t('write.successTitle') : t('write.errorTitle') }}
                </div>
                <div class="text-caption font-mono text-grey-6 dark:text-grey-4">
                  Target Address: {{ writeResult?.address }}
                </div>
              </div>
            </q-card-section>

            <q-card-section class="q-pt-none font-mono text-caption">
              <div v-if="writeResult?.success">
                <div>{{ t('write.successDesc') }}</div>
                <div class="q-mt-sm carfix-code-block q-pa-sm rounded-borders font-mono">
                  <div>{{ t('write.previousHex') }}: {{ writeResult.previousHex }}</div>
                  <div>{{ t('write.verifiedHex') }}: {{ writeResult.verifiedHex }}</div>
                </div>
              </div>
              <div v-else class="text-negative">
                {{ writeResult?.error || t('write.errorDesc') }}
              </div>
            </q-card-section>

            <q-card-actions align="right">
              <q-btn flat label="OK" color="primary" v-close-popup />
            </q-card-actions>
          </q-card>
        </q-dialog>

        <!-- Extended Diagnostic Mode Prompt Dialog -->
        <ExtDiagConfirmationDialog
          v-model="store.showExtDiagPrompt"
          @confirm="onExtDiagConfirmed"
          @cancel="onExtDiagCancelled"
        />
      </div>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useQuasar } from 'quasar';
import { useCarFixStore } from '../stores/carfixStore';
import { t } from '../core/i18n/translations';
import { getModuleAbbrevFromInfo } from '../core/utils/hexUtils';
import { generateModuleAsBuiltExportText } from '../core/utils/moduleExporter';
import { exportLogsToFile } from '../core/utils/logExporter';
import { getSafetyIcon, getSafetyIconColor, getSafetyTooltip } from '../core/utils/safetyRiskUtils';
import { IVehicleOption, IWriteResult } from '../core/types/module';
import WriteChallengeDialog from '../components/WriteChallengeDialog.vue';
import LineHistoryDialog from '../components/LineHistoryDialog.vue';
import ExtDiagConfirmationDialog from '../components/ExtDiagConfirmationDialog.vue';
import { backupManager } from '../core/safety/backupManager';

const $q = useQuasar();
const store = useCarFixStore();

const activeModulesSubTab = ref<'modules' | 'configure'>('modules');
const expandedModules = ref<Record<string, boolean>>({});
const exportingModuleId = ref<string | null>(null);

const optionSearchQuery = ref('');
const isChallengeOpen = ref(false);
const selectedOption = ref<IVehicleOption | null>(null);
const selectedTargetState = ref<boolean>(false);
const historyOption = ref<IVehicleOption | null>(null);
const isHistoryDialogOpen = ref(false);
const showResultDialog = ref(false);
const writeResult = ref<IWriteResult | null>(null);

const sortedModules = computed(() => {
  return [...store.detectedModules].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
});

onMounted(() => {
  if (store.isConnected && store.detectedModules.length === 0) {
    store.scanVehicleModules();
  }
});

function toggleModule(id: string) {
  expandedModules.value[id] = !expandedModules.value[id];
}

function isExpanded(id: string): boolean {
  return !!expandedModules.value[id];
}

async function handleExportModule(moduleId: string) {
  if (exportingModuleId.value) return;
  exportingModuleId.value = moduleId;

  const wasPolling = store.isPolling;
  if (wasPolling) {
    store.stopTelemetryPolling();
  }

  try {
    const { filename, content, lineCount } = await generateModuleAsBuiltExportText(moduleId);
    if (lineCount === 0 || !content) {
      $q.notify({
        type: 'warning',
        message: 'No As-Built data returned for module.',
        timeout: 3000
      });
      return;
    }

    const result = await exportLogsToFile(content, filename);
    if (result.success) {
      $q.notify({
        type: 'positive',
        message: `${t('modules.exportSuccess')} (${filename})`,
        timeout: 3000
      });
      store.addLog('INF', `Exported As-Built data for module ${moduleId} to ${filename} (${lineCount} lines)`);
    } else {
      $q.notify({
        type: 'negative',
        message: `${t('modules.exportFailed')}: ${result.error || 'Unknown error'}`,
        timeout: 4000
      });
      store.addLog('ERR', `Failed to export As-Built data for module ${moduleId}: ${result.error}`);
    }
  } catch (err: any) {
    $q.notify({
      type: 'negative',
      message: `${t('modules.exportFailed')}: ${err?.message || err}`,
      timeout: 4000
    });
    store.addLog('ERR', `Export error for module ${moduleId}: ${err?.message || err}`);
  } finally {
    exportingModuleId.value = null;
    if (wasPolling && store.isConnected) {
      await store.startTelemetryPolling();
    }
  }
}

// Vehicle Options Catalog Helpers
const groupedAndSortedOptions = computed(() => {
  let opts = store.availableOptions;
  if (optionSearchQuery.value.trim()) {
    const query = optionSearchQuery.value.trim().toLowerCase();
    opts = opts.filter((o) => {
      const title = getOptionTitle(o).toLowerCase();
      const desc = getOptionDescription(o).toLowerCase();
      const mod = (o.primaryModule || '').toLowerCase();
      const addr = (o.targetAddress || '').toLowerCase();
      return title.includes(query) || desc.includes(query) || mod.includes(query) || addr.includes(query);
    });
  }

  const standaloneOpts: any[] = [];
  const groupsMap = new Map<string, IVehicleOption[]>();

  opts.forEach((opt) => {
    const groupName = opt.group || opt.groupName;
    if (groupName) {
      if (!groupsMap.has(groupName)) {
        groupsMap.set(groupName, []);
      }
      groupsMap.get(groupName)!.push(opt);
    } else {
      standaloneOpts.push(opt);
    }
  });

  const groupItems: any[] = [];
  groupsMap.forEach((groupOpts, groupName) => {
    const sortedGroupOpts = [...groupOpts].sort((a, b) =>
      getOptionTitle(a).localeCompare(getOptionTitle(b), undefined, { numeric: true, sensitivity: 'base' })
    );
    groupItems.push({
      id: `group_${groupName}`,
      isGroup: true,
      groupName,
      options: sortedGroupOpts
    });
  });

  const getItemTitle = (item: any): string => {
    if (item.isGroup) {
      return item.groupName;
    }
    return getOptionTitle(item);
  };

  const combinedList = [...groupItems, ...standaloneOpts];
  combinedList.sort((a, b) =>
    getItemTitle(a).localeCompare(getItemTitle(b), undefined, { numeric: true, sensitivity: 'base' })
  );

  return combinedList;
});

function getGroupHistoryState(groupItem: any): 'ALL' | 'SOME' | 'NONE' {
  if (!groupItem || !groupItem.isGroup || !groupItem.options) return 'NONE';
  const historyCount = groupItem.options.filter((opt: IVehicleOption) => hasHistory(opt)).length;
  if (historyCount === 0) return 'NONE';
  if (historyCount === groupItem.options.length) return 'ALL';
  return 'SOME';
}

function getModuleAbbreviation(moduleCode?: string): string {
  if (!moduleCode) return 'UNKNOWN';
  const map: Record<string, string> = {
    '726': 'BCM',
    '706': 'IPMA',
    '7D0': 'APIM',
    '7A6': 'IPC',
    '760': 'ABS',
    '7E0': 'PCM'
  };
  return map[moduleCode] || moduleCode;
}

function isOptionRead(option: IVehicleOption): boolean {
  return !!store.moduleData[option.targetAddress];
}

function isOptionEnabled(option: IVehicleOption): boolean {
  return store.evaluateOptionState(option);
}

function hasHistory(option: IVehicleOption): boolean {
  return backupManager.getLineHistory(option.targetAddress).length > 0;
}

async function onOptionRead(opt?: IVehicleOption) {
  if (!store.isConnected || !opt) return;
  if (isOptionRead(opt)) return;

  if (store.isEngineRunning) {
    $q.notify({
      type: 'warning',
      message: t('options.engineRunningBanner'),
      icon: 'warning',
      timeout: 4000
    });
    return;
  }

  if (!store.hasConfirmedExtDiag) {
    await store.requestOptionsRefresh(opt);
    return;
  }

  await store.readOptionLine(opt);
}

async function onExtDiagConfirmed() {
  await store.confirmOptionsRefresh();
}

function onExtDiagCancelled() {
  store.cancelOptionsRefresh();
}

function requestOptionToggle(option: IVehicleOption, enable: boolean) {
  if (!store.isVinMatched) return;
  if (!store.isOptionFirmwareSatisfied(option)) {
    $q.notify({
      type: 'negative',
      message: 'Firmware Requirement Unmet',
      caption: store.getOptionFirmwareMissingReason(option),
      icon: 'error',
      timeout: 5000
    });
    return;
  }
  selectedOption.value = option;
  selectedTargetState.value = enable;
  isChallengeOpen.value = true;
}

function openHistory(option: IVehicleOption) {
  if (!store.isOptionFirmwareSatisfied(option)) return;
  historyOption.value = option;
  isHistoryDialogOpen.value = true;
}

function onLineRestored() {
  isHistoryDialogOpen.value = false;
}

async function onChallengeAuthorized() {
  if (selectedOption.value) {
    await store.toggleOption(selectedOption.value, selectedTargetState.value);
    writeResult.value = store.lastWriteResult;
    showResultDialog.value = true;

    if (store.lastWriteResult?.success) {
      $q.notify({
        type: 'positive',
        message: t('write.successTitle'),
        caption: `Target Address ${store.lastWriteResult.address} verified and flashed.`,
        icon: 'check_circle',
        timeout: 4000
      });
    } else {
      $q.notify({
        type: 'negative',
        message: t('write.errorTitle'),
        caption: store.lastWriteResult?.error || t('write.errorDesc'),
        icon: 'error',
        timeout: 5000
      });
    }
  }
}

function getOptionTitle(option: IVehicleOption): string {
  if (option.nameKey) {
    const translated = t(option.nameKey);
    if (translated !== option.nameKey) return translated;
  }
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
  const translationKey = keyMap[option.id];
  if (translationKey) {
    const translated = t(translationKey);
    if (translated !== translationKey) return translated;
  }
  return option.name || option.id;
}

function getOptionDescription(option: IVehicleOption): string {
  if (option.descriptionKey) {
    const translated = t(option.descriptionKey);
    if (translated !== option.descriptionKey) return translated;
  }
  const keyMap: Record<string, string> = {
    'f150_double_horn_honk': 'option.double_horn_desc',
    'f150_enable_lane_change_assist': 'option.lane_change_desc',
    'f150_enable_in_lane_repositioning': 'option.in_lane_desc',
    'f150_bambi_mode_fog_high_beam': 'option.bambi_mode_desc',
    'f150_turn_signal_tap_5': 'option.tap_count_desc',
    'f150_disable_beltminder_driver': 'option.beltminder_desc',
    'f150_disable_ese_engine_sound': 'option.ese_sound_desc',
    'f150_offroad_screen_cluster': 'option.offroad_screen_desc'
  };
  const translationKey = keyMap[option.id];
  if (translationKey) {
    const translated = t(translationKey);
    if (translated !== translationKey) return translated;
  }
  return option.description || option.descriptionKey || '';
}
</script>

<style scoped lang="scss">
.shrink-0 {
  flex-shrink: 0 !important;
}

.border-bottom-subtle {
  border-bottom: 1px solid var(--carfix-border);
  &:last-child {
    border-bottom: none;
  }
}

.border-top-subtle {
  border-top: 1px solid var(--carfix-border);
}

.module-row-interactive {
  transition: background-color 0.2s ease;
  user-select: none;

  &:hover, &:focus-visible {
    background-color: rgba(2, 123, 227, 0.08);
    outline: none;
  }
}

.version-text-ellipsis {
  word-break: break-all !important;
  overflow-wrap: break-word !important;
  line-height: 1.35;
}

.text-wrap-break {
  word-break: break-all;
  overflow-wrap: anywhere;
}

.option-title-wrap {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.35;
}

.option-desc-wrap {
  white-space: normal !important;
  word-break: break-word !important;
  overflow-wrap: break-word !important;
  line-height: 1.4;
}

.font-mono {
  font-family: monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo;
}
</style>
