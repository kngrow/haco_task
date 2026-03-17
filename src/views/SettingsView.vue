<script setup lang="ts">
import { ref } from "vue";
import TaskTypeManager from "../components/settings/TaskTypeManager.vue";
import StatusManager from "../components/settings/StatusManager.vue";
import type { TaskType } from "../types";

const selectedType = ref<TaskType | null>(null);

function onSelectType(tt: TaskType) {
  selectedType.value = tt;
}
</script>

<template>
  <div>
    <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">タスクタイプ設定</h1>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
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
  </div>
</template>
