<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { useTodayTasks } from "../composables/useTodayTasks";
import { useTasks } from "../composables/useTasks";
import TodayTaskCard from "../components/tasks/TodayTaskCard.vue";
import TaskDetail from "../components/tasks/TaskDetail.vue";
import TaskModal from "../components/tasks/TaskModal.vue";
import type { TodayTask, Task } from "../types";

const {
  inProgressTasks,
  dueTodayTasks,
  startingTodayTasks,
  overdueTasks,
  completedTasks,
  fetchAll,
  fetchTaskStatusHistory,
} = useTodayTasks();

const { advanceStatus, completeTask, fetchTaskById } = useTasks();

// --- 日付ナビゲーション ---

function toDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const todayString = toDateString(new Date());
const selectedDate = ref(todayString);

const isToday = computed(() => selectedDate.value === todayString);

const displayDate = computed(() => {
  const d = new Date(selectedDate.value + "T00:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  return `${m}/${day}（${weekdays[d.getDay()]}）`;
});

const periodLabel = computed(() => (isToday.value ? "今日" : displayDate.value));

function prevDay() {
  const d = new Date(selectedDate.value + "T00:00:00");
  d.setDate(d.getDate() - 1);
  selectedDate.value = toDateString(d);
}

function nextDay() {
  const d = new Date(selectedDate.value + "T00:00:00");
  d.setDate(d.getDate() + 1);
  selectedDate.value = toDateString(d);
}

watch(selectedDate, (date) => fetchAll(date));

onMounted(() => fetchAll(selectedDate.value));

// --- タスク詳細・編集 ---

const selectedTask = ref<Task | null>(null);
const editingTask = ref<Task | null>(null);
const showEditModal = ref(false);

async function handleSelect(todayTask: TodayTask) {
  const task = await fetchTaskById(todayTask.id);
  if (task) selectedTask.value = task;
}

function handleEditFromDetail(task: Task) {
  selectedTask.value = null;
  editingTask.value = task;
  showEditModal.value = true;
}

async function onDetailUpdated() {
  await fetchAll(selectedDate.value);
}

async function onEditSaved() {
  showEditModal.value = false;
  editingTask.value = null;
  await fetchAll(selectedDate.value);
}

// --- ステータス進行 / 完了 ---

async function handleAdvance(task: TodayTask) {
  if (!task.next_status_id || task.current_status_id === null) return;
  await advanceStatus(task.id, task.next_status_id, task.current_status_id);
  await fetchAll(selectedDate.value);
}

async function handleComplete(task: TodayTask) {
  await completeTask(task.id);
  await fetchAll(selectedDate.value);
}

// --- 日報MD生成 ---

const showReportModal = ref(false);
const reportMarkdown = ref("");
const reportCopied = ref(false);
const isGenerating = ref(false);

function fmtDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const [, m, d] = dateStr.split("-");
  return `${parseInt(m)}/${parseInt(d)}`;
}

function fmtDateRange(started: string | null, due: string | null): string {
  const s = fmtDate(started);
  const d = fmtDate(due);
  if (s && d && s !== d) return `${s}~${d}`;
  return s || d;
}

async function taskToMdBlock(task: TodayTask): Promise<string> {
  const history = await fetchTaskStatusHistory(task.id);
  const lines = [`- ${task.title}`];

  if (history.length === 0) return lines.join("\n");

  for (const h of history) {
    const range = fmtDateRange(h.started_at, h.due_date);
    if (h.completed_at !== null) {
      const datePart = range ? ` ${range} ` : "";
      lines.push(`  - ~${h.status_name}${datePart}~`);
    } else {
      lines.push(`  - ${h.status_name}`);
    }
  }

  return lines.join("\n");
}

async function openReportModal() {
  isGenerating.value = true;
  showReportModal.value = true;

  const d = new Date(selectedDate.value + "T00:00:00");
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const weekdays = ["日", "月", "火", "水", "木", "金", "土"];
  const dateLabel = `${m}/${day}（${weekdays[d.getDay()]}）`;

  const seen = new Set<number>();
  const allTasks: TodayTask[] = [];
  for (const t of [
    ...inProgressTasks.value,
    ...dueTodayTasks.value,
    ...startingTodayTasks.value,
    ...overdueTasks.value,
    ...completedTasks.value,
  ]) {
    if (!seen.has(t.id)) {
      seen.add(t.id);
      allTasks.push(t);
    }
  }

  const blocks = await Promise.all(allTasks.map((t) => taskToMdBlock(t)));
  reportMarkdown.value = [`## ${dateLabel} 日報\n`, ...blocks].join("\n");
  isGenerating.value = false;
}

async function copyReport() {
  await navigator.clipboard.writeText(reportMarkdown.value);
  reportCopied.value = true;
  setTimeout(() => (reportCopied.value = false), 2000);
}
</script>

<template>
  <div class="max-w-3xl mx-auto py-6 px-2">
    <!-- Header -->
    <div class="flex items-center gap-1 mb-6">
      <button
        @click="prevDay"
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="前の日"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <div class="flex items-center gap-2.5 px-2">
        <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">
          {{ isToday ? "Today" : displayDate }}
        </h1>
        <span v-if="isToday" class="text-sm text-slate-400">{{ displayDate }}</span>
        <button
          v-else
          @click="selectedDate = todayString"
          class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
        >
          今日に戻る
        </button>
      </div>

      <button
        @click="nextDay"
        class="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        title="次の日"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>

      <div class="ml-auto flex items-center gap-1">
        <button
          @click="openReportModal"
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          日報
        </button>
        <button
          @click="editingTask = null; showEditModal = true"
          class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          タスク追加
        </button>
      </div>
    </div>

    <!-- 進行中 -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-indigo-400"></span>
        進行中
        <span v-if="inProgressTasks.length > 0" class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {{ inProgressTasks.length }}
        </span>
      </h2>
      <div v-if="inProgressTasks.length > 0" class="space-y-2">
        <TodayTaskCard
          v-for="task in inProgressTasks"
          :key="task.id"
          :task="task"
          @advance="handleAdvance"
          @complete="handleComplete"
          @select="handleSelect"
        />
      </div>
      <p v-else class="text-slate-400 text-sm pl-4">進行中のタスクはありません</p>
    </section>

    <!-- 期日 -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-amber-400"></span>
        {{ periodLabel }}が期日
        <span v-if="dueTodayTasks.length > 0" class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {{ dueTodayTasks.length }}
        </span>
      </h2>
      <div v-if="dueTodayTasks.length > 0" class="space-y-2">
        <TodayTaskCard
          v-for="task in dueTodayTasks"
          :key="task.id"
          :task="task"
          @advance="handleAdvance"
          @complete="handleComplete"
          @select="handleSelect"
        />
      </div>
      <p v-else class="text-slate-400 text-sm pl-4">{{ periodLabel }}が期日のタスクはありません</p>
    </section>

    <!-- 開始日 -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
        {{ periodLabel }}が開始日
        <span v-if="startingTodayTasks.length > 0" class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {{ startingTodayTasks.length }}
        </span>
      </h2>
      <div v-if="startingTodayTasks.length > 0" class="space-y-2">
        <TodayTaskCard
          v-for="task in startingTodayTasks"
          :key="task.id"
          :task="task"
          @advance="handleAdvance"
          @complete="handleComplete"
          @select="handleSelect"
        />
      </div>
      <p v-else class="text-slate-400 text-sm pl-4">{{ periodLabel }}が開始日のタスクはありません</p>
    </section>

    <!-- 期日超過 -->
    <section class="mb-8">
      <h2 class="text-sm font-semibold text-red-600 mb-3 flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-red-500"></span>
        期日超過
        <span v-if="overdueTasks.length > 0" class="text-xs font-medium text-red-400 bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 rounded-full">
          {{ overdueTasks.length }}
        </span>
      </h2>
      <div v-if="overdueTasks.length > 0" class="space-y-2">
        <TodayTaskCard
          v-for="task in overdueTasks"
          :key="task.id"
          :task="task"
          :show-due-date="true"
          variant="overdue"
          @advance="handleAdvance"
          @complete="handleComplete"
          @select="handleSelect"
        />
      </div>
      <p v-else class="text-slate-400 text-sm pl-4">期日超過のタスクはありません</p>
    </section>

    <!-- 完了 -->
    <section v-if="completedTasks.length > 0" class="mb-8">
      <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 flex items-center gap-2">
        <span class="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
        完了
        <span class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
          {{ completedTasks.length }}
        </span>
      </h2>
      <div class="space-y-2">
        <TodayTaskCard
          v-for="task in completedTasks"
          :key="task.id"
          :task="task"
          :show-due-date="true"
          variant="completed"
          @select="handleSelect"
        />
      </div>
    </section>

    <!-- 詳細モーダル -->
    <TaskDetail
      v-if="selectedTask"
      :task="selectedTask"
      @close="selectedTask = null"
      @edit="handleEditFromDetail"
      @updated="onDetailUpdated"
    />

    <!-- 編集モーダル -->
    <TaskModal
      v-if="showEditModal"
      :editTask="editingTask"
      @close="showEditModal = false; editingTask = null"
      @saved="onEditSaved"
    />

    <!-- 日報モーダル -->
    <Teleport to="body">
      <div
        v-if="showReportModal"
        class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        @click.self="showReportModal = false"
      >
        <div class="bg-white dark:bg-slate-900 rounded-xl shadow-xl w-full max-w-lg flex flex-col gap-4 p-5">
          <div class="flex items-center justify-between">
            <h2 class="text-sm font-semibold text-slate-800 dark:text-slate-100">日報</h2>
            <button
              @click="showReportModal = false"
              class="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div v-if="isGenerating" class="flex items-center justify-center py-8 text-slate-400 text-sm">
            生成中...
          </div>
          <textarea
            v-else
            :value="reportMarkdown"
            readonly
            class="w-full h-64 text-sm font-mono bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-lg p-3 resize-none focus:outline-none"
            @click="($event.target as HTMLTextAreaElement).select()"
          />

          <div class="flex justify-end">
            <button
              @click="copyReport"
              class="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
              :class="reportCopied
                ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30'
                : 'text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700'"
            >
              <svg v-if="!reportCopied" class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              <svg v-else class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              {{ reportCopied ? "コピーしました" : "コピー" }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
