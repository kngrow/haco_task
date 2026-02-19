<script setup lang="ts">
import type { Task, TaskType, Status } from "../../types";

const props = defineProps<{
  task: Task;
  taskTypes: TaskType[];
  statuses: Status[];
}>();

const emit = defineEmits<{
  select: [task: Task];
}>();

function getTypeName(taskTypeId: number | null): string {
  if (!taskTypeId) return "Inbox";
  const t = props.taskTypes.find((tt) => tt.id === taskTypeId);
  return t ? t.name : "Unknown";
}

function getStatusName(statusId: number | null): string {
  if (!statusId) return "Inbox";
  const s = props.statuses.find((st) => st.id === statusId);
  return s ? s.name : "Unknown";
}
</script>

<template>
  <div
    class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-4 cursor-pointer hover:shadow-md hover:border-slate-300 dark:hover:border-slate-600 transition-all duration-150"
    @click="emit('select', task)"
  >
    <h3 class="font-semibold text-slate-900 dark:text-slate-100 truncate">{{ task.title }}</h3>
    <div class="mt-2 flex items-center gap-2 text-sm">
      <span class="inline-block bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-full text-xs font-medium">
        {{ getTypeName(task.task_type_id) }}
      </span>
      <span class="inline-block bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 rounded-full text-xs font-medium">
        {{ getStatusName(task.current_status_id) }}
      </span>
    </div>
    <p v-if="task.description" class="mt-2 text-sm text-slate-500 dark:text-slate-400 line-clamp-2">
      {{ task.description }}
    </p>
  </div>
</template>
