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
  fetchAll,
} = useTodayTasks();

const { advanceStatus, fetchTaskById } = useTasks();

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

// --- ステータス進行 ---

async function handleAdvance(task: TodayTask) {
  if (!task.next_status_id || task.current_status_id === null) return;
  await advanceStatus(task.id, task.next_status_id, task.current_status_id);
  await fetchAll(selectedDate.value);
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
          @select="handleSelect"
        />
      </div>
      <p v-else class="text-slate-400 text-sm pl-4">期日超過のタスクはありません</p>
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
  </div>
</template>
