<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useTasks } from "../composables/useTasks";
import { useTaskTypes } from "../composables/useTaskTypes";
import TaskCard from "../components/tasks/TaskCard.vue";
import TaskModal from "../components/tasks/TaskModal.vue";
import TaskDetail from "../components/tasks/TaskDetail.vue";
import type { Task, TaskType, Status } from "../types";
import { getDb } from "../composables/useDatabase";

const { tasks, fetchTasks } = useTasks();
const { taskTypes, fetchTaskTypes } = useTaskTypes();

const allStatuses = ref<Status[]>([]);

const showCreateModal = ref(false);
const editingTask = ref<Task | null>(null);
const selectedTask = ref<Task | null>(null);

onMounted(async () => {
  await fetchTaskTypes();
  await loadAllStatuses();
  await fetchTasks();
});

async function loadAllStatuses() {
  const db = await getDb();
  allStatuses.value = await db.select<Status[]>("SELECT * FROM statuses ORDER BY position");
}

// 完了タスク
const completedTasks = computed(() =>
  tasks.value.filter((t) => t.is_complete === 1)
);

// Inbox tasks (no task type, not completed)
const inboxTasks = computed(() =>
  tasks.value.filter((t) => t.task_type_id === null && t.is_complete !== 1)
);

// Tasks grouped by task type (not completed)
const groupedTasks = computed(() =>
  taskTypes.value.map((tt) => ({
    type: tt,
    tasks: tasks.value.filter((t) => t.task_type_id === tt.id && t.is_complete !== 1),
  }))
);

function openCreate() {
  editingTask.value = null;
  showCreateModal.value = true;
}

function openDetail(task: Task) {
  selectedTask.value = task;
}

function openEdit(task: Task) {
  selectedTask.value = null;
  editingTask.value = task;
  showCreateModal.value = true;
}

async function onSaved() {
  showCreateModal.value = false;
  editingTask.value = null;
  await fetchTasks();
  await loadAllStatuses();
}

async function onDetailUpdated() {
  await fetchTasks();
}

function closeDetail() {
  selectedTask.value = null;
}

function closeModal() {
  showCreateModal.value = false;
  editingTask.value = null;
}
</script>

<template>
  <div>
    <!-- Header -->
    <div class="flex items-center justify-between mb-6">
      <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100">タスク</h1>
      <button
        @click="openCreate"
        class="inline-flex items-center gap-1.5 bg-indigo-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
      >
        <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
        新しいタスク
      </button>
    </div>

    <!-- Empty state (全体が空のとき) -->
    <div v-if="tasks.length === 0 && taskTypes.length === 0" class="text-center py-16 text-slate-400">
      <svg class="w-12 h-12 mx-auto mb-3 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-base font-medium text-slate-500">タスクがありません</p>
      <p class="text-sm mt-1">「+ 新しいタスク」から作成してください</p>
    </div>

    <div class="space-y-8">
      <!-- Inbox section -->
      <section v-if="inboxTasks.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">Inbox</h2>
          <span class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
            {{ inboxTasks.length }}
          </span>
        </div>
        <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <TaskCard
            v-for="task in inboxTasks"
            :key="task.id"
            :task="task"
            :taskTypes="taskTypes"
            :statuses="allStatuses"
            @select="openDetail"
          />
        </div>
      </section>

      <!-- Per-type sections -->
      <section v-for="group in groupedTasks" :key="group.type.id">
        <div class="flex items-center gap-2 mb-3">
          <h2 class="text-sm font-semibold text-slate-700 dark:text-slate-300">{{ group.type.name }}</h2>
          <span class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
            {{ group.tasks.length }}
          </span>
        </div>
        <div v-if="group.tasks.length > 0" class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <TaskCard
            v-for="task in group.tasks"
            :key="task.id"
            :task="task"
            :taskTypes="taskTypes"
            :statuses="allStatuses"
            @select="openDetail"
          />
        </div>
        <p v-else class="text-sm text-slate-400 pl-1">
          タスクがありません
        </p>
      </section>

      <!-- 完了セクション -->
      <section v-if="completedTasks.length > 0">
        <div class="flex items-center gap-2 mb-3">
          <span class="inline-block w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600"></span>
          <h2 class="text-sm font-semibold text-slate-500 dark:text-slate-400">完了</h2>
          <span class="text-xs font-medium text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded-full">
            {{ completedTasks.length }}
          </span>
        </div>
        <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          <TaskCard
            v-for="task in completedTasks"
            :key="task.id"
            :task="task"
            :taskTypes="taskTypes"
            :statuses="allStatuses"
            @select="openDetail"
          />
        </div>
      </section>
    </div>

    <!-- Create / Edit Modal -->
    <TaskModal
      v-if="showCreateModal"
      :editTask="editingTask"
      @close="closeModal"
      @saved="onSaved"
    />

    <!-- Detail view -->
    <TaskDetail
      v-if="selectedTask"
      :task="selectedTask"
      @close="closeDetail"
      @edit="openEdit"
      @updated="onDetailUpdated"
    />
  </div>
</template>
