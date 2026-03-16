<script setup lang="ts">
import type { TodayTask } from "../../types";

const props = defineProps<{
  task: TodayTask;
  showDueDate?: boolean;
  variant?: "default" | "overdue" | "completed";
}>();

const emit = defineEmits<{
  advance: [task: TodayTask];
  complete: [task: TodayTask];
  select: [task: TodayTask];
}>();

const isCompleted = props.task.is_complete === 1;
const isFinal = !props.task.next_status_id && props.task.current_status_id !== null;
const canAdvance = !!props.task.next_status_id;

function handleCheckClick() {
  if (isCompleted) return;
  if (isFinal) {
    emit("complete", props.task);
  } else if (canAdvance) {
    emit("advance", props.task);
  }
}
</script>

<template>
  <div
    class="flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-150 cursor-pointer"
    :class="
      isCompleted
        ? 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:bg-slate-100 dark:hover:bg-slate-700/50 opacity-60'
        : variant === 'overdue'
        ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50'
        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/70'
    "
    @click="emit('select', task)"
  >
    <!-- Checkbox circle -->
    <button
      @click.stop="handleCheckClick"
      :disabled="!canAdvance && !isFinal || isCompleted"
      class="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all group/check"
      :class="[
        isCompleted
          ? 'border-slate-300 dark:border-slate-600 bg-slate-100 dark:bg-slate-700 cursor-default'
          : isFinal
          ? 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:border-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-900/50'
          : canAdvance
          ? variant === 'overdue'
            ? 'border-red-300 dark:border-red-600 hover:border-red-500 hover:bg-red-100 dark:hover:bg-red-900/50'
            : 'border-slate-300 dark:border-slate-600 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/50'
          : 'border-slate-200 dark:border-slate-700 cursor-default',
      ]"
      :title="isCompleted ? '完了済み' : isFinal ? 'タスクを完了にする' : canAdvance ? '次のステータスへ進める' : ''"
    >
      <svg
        v-if="isCompleted"
        class="w-3 h-3 text-slate-400 dark:text-slate-500"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <svg
        v-else-if="isFinal"
        class="w-3 h-3 text-emerald-500 opacity-40 group-hover/check:opacity-100 transition-opacity"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
      <svg
        v-else-if="canAdvance"
        class="w-3 h-3 opacity-0 group-hover/check:opacity-100 transition-opacity"
        :class="variant === 'overdue' ? 'text-red-400' : 'text-indigo-400'"
        fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="3"
      >
        <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
      </svg>
    </button>

    <!-- Content -->
    <div class="flex-1 min-w-0">
      <p
        class="font-medium truncate text-sm"
        :class="[
          isCompleted
            ? 'line-through text-slate-400 dark:text-slate-500'
            : variant === 'overdue'
            ? 'text-red-900 dark:text-red-200'
            : 'text-slate-900 dark:text-slate-100',
        ]"
      >
        {{ task.title }}
      </p>
      <div class="mt-0.5 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span v-if="task.task_type_name">{{ task.task_type_name }}</span>
        <span v-if="showDueDate && task.due_date" class="font-medium" :class="variant === 'overdue' ? 'text-red-500 dark:text-red-400' : ''">
          期日: {{ task.due_date }}
        </span>
      </div>
    </div>

    <!-- Status badge -->
    <span
      v-if="task.status_name"
      class="shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
      :class="
        isCompleted
          ? 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
          : variant === 'overdue'
          ? 'bg-red-200 dark:bg-red-900/50 text-red-800 dark:text-red-300'
          : 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300'
      "
    >
      {{ task.status_name }}
    </span>
  </div>
</template>
