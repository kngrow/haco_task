<script setup lang="ts">
import { ref } from "vue";
import { getVersion } from "@tauri-apps/api/app";
import { useDarkMode } from "../composables/useDarkMode";
import TaskTypeManager from "../components/settings/TaskTypeManager.vue";
import StatusManager from "../components/settings/StatusManager.vue";
import type { TaskType } from "../types";

const { isDark, toggle } = useDarkMode();
const selectedType = ref<TaskType | null>(null);
const version = ref("");
getVersion().then((v) => (version.value = v));

function onSelectType(tt: TaskType) {
  selectedType.value = tt;
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">設定</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- Theme -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 lg:col-span-2">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">テーマ</h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">ダークモード</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">アプリ全体の配色を切り替えます</p>
          </div>
          <!-- Toggle switch -->
          <button
            @click="toggle"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            :class="isDark ? 'bg-indigo-600' : 'bg-slate-200'"
            :aria-pressed="isDark"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :class="isDark ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>

      <!-- Task Types -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <TaskTypeManager @selectType="onSelectType" />
      </div>

      <!-- Statuses for selected type -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <template v-if="selectedType">
          <StatusManager :taskType="selectedType" />
        </template>
        <template v-else>
          <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-2">ステータス管理</h3>
          <p class="text-sm text-slate-400 dark:text-slate-500">
            左のタスクタイプを選択すると、ステータスの管理ができます。
          </p>
        </template>
      </div>
    </div>

    <!-- Version -->
    <p class="mt-8 text-xs text-slate-400 dark:text-slate-600">v{{ version }}</p>
  </div>
</template>
