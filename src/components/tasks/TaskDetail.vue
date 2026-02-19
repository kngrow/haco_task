<script setup lang="ts">
import { ref, onMounted, computed, watch } from "vue";
import MarkdownIt from "markdown-it";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useTasks } from "../../composables/useTasks";
import { useTaskTypes } from "../../composables/useTaskTypes";
import TaskComments from "./TaskComments.vue";
import type { Task, Status } from "../../types";

const md = new MarkdownIt({ html: false, linkify: true, breaks: true });

const props = defineProps<{
  task: Task;
}>();

const emit = defineEmits<{
  close: [];
  edit: [task: Task];
  updated: [];
}>();

const { advanceStatus, fetchTaskStatusDates, taskStatusDates, deleteTask, fetchTaskById } = useTasks();
const { statuses, fetchStatuses, taskTypes, fetchTaskTypes } = useTaskTypes();

const currentTask = ref<Task>({ ...props.task });

onMounted(async () => {
  await fetchTaskTypes();
  if (currentTask.value.task_type_id) {
    await fetchStatuses(currentTask.value.task_type_id);
    await fetchTaskStatusDates(currentTask.value.id);
  }
});

watch(
  () => props.task,
  (t) => {
    currentTask.value = { ...t };
  }
);

const currentStatus = computed<Status | null>(() => {
  if (!currentTask.value.current_status_id) return null;
  return statuses.value.find((s) => s.id === currentTask.value.current_status_id) ?? null;
});

const nextStatus = computed<Status | null>(() => {
  if (!currentStatus.value) return null;
  const currentPos = currentStatus.value.position;
  const sorted = [...statuses.value].sort((a, b) => a.position - b.position);
  return sorted.find((s) => s.position > currentPos) ?? null;
});

const typeName = computed(() => {
  if (!currentTask.value.task_type_id) return "Inbox";
  const t = taskTypes.value.find((tt) => tt.id === currentTask.value.task_type_id);
  return t ? t.name : "Unknown";
});

async function handleAdvance() {
  if (!nextStatus.value) return;
  await advanceStatus(
    currentTask.value.id,
    nextStatus.value.id,
    currentTask.value.current_status_id
  );
  const updated = await fetchTaskById(currentTask.value.id);
  if (updated) {
    currentTask.value = updated;
  }
  await fetchTaskStatusDates(currentTask.value.id);
  emit("updated");
}

async function handleDelete() {
  if (!confirm("このタスクを削除しますか？")) return;
  await deleteTask(currentTask.value.id);
  emit("updated");
  emit("close");
}

function getStatusName(statusId: number): string {
  const s = statuses.value.find((st) => st.id === statusId);
  return s ? s.name : "Unknown";
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "-";
  return dateStr;
}

function handleDescriptionClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest("a");
  if (target && target.href) {
    e.preventDefault();
    openUrl(target.href);
  }
}

const renderedDescription = computed(() =>
  currentTask.value.description ? md.render(currentTask.value.description) : ""
);
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100 truncate flex-1 mr-4">{{ currentTask.title }}</h2>
        <div class="flex items-center gap-1.5 shrink-0">
          <button
            @click="emit('edit', currentTask)"
            class="text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
          >
            編集
          </button>
          <button
            @click="handleDelete"
            class="text-sm font-medium text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            削除
          </button>
          <button
            @click="emit('close')"
            class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-1.5 transition-colors ml-1"
          >
            <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-5">
        <!-- Badges -->
        <div class="flex flex-wrap gap-2">
          <span class="inline-block bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2.5 py-1 rounded-full text-xs font-medium">
            {{ typeName }}
          </span>
          <span class="inline-block bg-emerald-50 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-full text-xs font-medium">
            {{ currentStatus ? currentStatus.name : "Inbox" }}
          </span>
        </div>

        <!-- Description -->
        <div v-if="currentTask.description">
          <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1.5">説明</h4>
          <div
            class="text-sm text-slate-700 dark:text-slate-300 leading-relaxed prose prose-sm max-w-none dark:prose-invert"
            v-html="renderedDescription"
            @click="handleDescriptionClick"
          ></div>
        </div>

        <!-- Advance status -->
        <div v-if="nextStatus" class="bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 rounded-xl p-4">
          <div class="flex items-center justify-between gap-3">
            <div>
              <p class="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wide mb-0.5">次のステータス</p>
              <p class="text-sm font-semibold text-indigo-900 dark:text-indigo-200">{{ nextStatus.name }}</p>
            </div>
            <button
              @click="handleAdvance"
              class="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shrink-0"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              進める
            </button>
          </div>
        </div>
        <div v-else-if="currentStatus" class="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3.5">
          <p class="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
            <svg class="w-4 h-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            最終ステータスです
          </p>
        </div>

        <!-- Status dates -->
        <div v-if="taskStatusDates.length > 0">
          <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-2.5">ステータス別情報</h4>
          <div class="space-y-2">
            <div
              v-for="tsd in taskStatusDates"
              :key="tsd.id"
              class="border rounded-xl p-3.5 text-sm transition-colors"
              :class="{
                'border-emerald-200 dark:border-emerald-700 bg-emerald-50 dark:bg-emerald-900/20': currentTask.current_status_id === tsd.status_id,
                'border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/30': currentTask.current_status_id !== tsd.status_id,
              }"
            >
              <h5 class="font-semibold text-slate-800 dark:text-slate-200 mb-2">{{ getStatusName(tsd.status_id) }}</h5>
              <div class="grid grid-cols-3 gap-2 text-xs">
                <div>
                  <span class="text-slate-400 dark:text-slate-500 block mb-0.5">開始日</span>
                  <span class="text-slate-700 dark:text-slate-300 font-medium">{{ formatDate(tsd.started_at) }}</span>
                </div>
                <div>
                  <span class="text-slate-400 dark:text-slate-500 block mb-0.5">期日</span>
                  <span class="text-slate-700 dark:text-slate-300 font-medium">{{ formatDate(tsd.due_date) }}</span>
                </div>
                <div>
                  <span class="text-slate-400 dark:text-slate-500 block mb-0.5">完了日</span>
                  <span class="text-slate-700 dark:text-slate-300 font-medium">{{ formatDate(tsd.completed_at) }}</span>
                </div>
              </div>
              <p v-if="tsd.notes" class="text-xs text-slate-600 dark:text-slate-400 mt-2 border-t border-slate-200 dark:border-slate-600 pt-2">
                {{ tsd.notes }}
              </p>
            </div>
          </div>
        </div>

        <!-- Comments -->
        <div class="border-t border-slate-100 dark:border-slate-700 pt-5">
          <TaskComments :taskId="currentTask.id" />
        </div>
      </div>
    </div>
  </div>
</template>
