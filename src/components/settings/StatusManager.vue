<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useTaskTypes } from "../../composables/useTaskTypes";
import type { TaskType, Status } from "../../types";

const props = defineProps<{
  taskType: TaskType;
}>();

const { statuses, fetchStatuses, createStatus, updateStatus, deleteStatus } = useTaskTypes();

const newStatusName = ref("");
const editingId = ref<number | null>(null);
const editingName = ref("");

onMounted(() => {
  fetchStatuses(props.taskType.id);
});

watch(
  () => props.taskType.id,
  (id) => fetchStatuses(id)
);

async function handleCreate() {
  const name = newStatusName.value.trim();
  if (!name) return;
  const maxPos = statuses.value.reduce((max, s) => Math.max(max, s.position), 0);
  await createStatus(props.taskType.id, name, maxPos + 1);
  newStatusName.value = "";
}

function startEdit(status: Status) {
  editingId.value = status.id;
  editingName.value = status.name;
}

function cancelEdit() {
  editingId.value = null;
  editingName.value = "";
}

async function handleUpdate(status: Status) {
  if (!editingName.value.trim()) return;
  await updateStatus(status.id, editingName.value.trim(), status.position);
  await fetchStatuses(props.taskType.id);
  cancelEdit();
}

async function handleDelete(status: Status) {
  if (!confirm(`ステータス「${status.name}」を削除しますか？該当タスクはInboxに移動されます。`)) return;
  await deleteStatus(status.id);
  await fetchStatuses(props.taskType.id);
}

async function moveUp(status: Status) {
  const sorted = [...statuses.value].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((s) => s.id === status.id);
  if (idx <= 0) return;
  const prev = sorted[idx - 1];
  const tempPos = prev.position;
  await updateStatus(prev.id, prev.name, status.position);
  await updateStatus(status.id, status.name, tempPos);
  await fetchStatuses(props.taskType.id);
}

async function moveDown(status: Status) {
  const sorted = [...statuses.value].sort((a, b) => a.position - b.position);
  const idx = sorted.findIndex((s) => s.id === status.id);
  if (idx < 0 || idx >= sorted.length - 1) return;
  const next = sorted[idx + 1];
  const tempPos = next.position;
  await updateStatus(next.id, next.name, status.position);
  await updateStatus(status.id, status.name, tempPos);
  await fetchStatuses(props.taskType.id);
}
</script>

<template>
  <div>
    <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-0.5">{{ taskType.name }} のステータス</h3>
    <p class="text-xs text-slate-400 dark:text-slate-500 mb-4">上から順にワークフローが進みます</p>

    <!-- Add new status -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="newStatusName"
        type="text"
        placeholder="新しいステータス名"
        class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-slate-400 dark:placeholder-slate-500"
        @keydown.enter="handleCreate"
      />
      <button
        @click="handleCreate"
        :disabled="!newStatusName.trim()"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        追加
      </button>
    </div>

    <!-- Status list -->
    <div v-if="statuses.length === 0" class="text-sm text-slate-400 dark:text-slate-500 py-2">
      ステータスがありません。上から追加してください。
    </div>
    <ul class="space-y-2">
      <li
        v-for="(status, index) in statuses"
        :key="status.id"
        class="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3"
      >
        <!-- Position number -->
        <span class="text-xs text-slate-400 dark:text-slate-500 w-5 text-center font-medium shrink-0">{{ index + 1 }}</span>

        <template v-if="editingId === status.id">
          <input
            v-model="editingName"
            type="text"
            class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keydown.enter="handleUpdate(status)"
            @keydown.escape="cancelEdit"
          />
          <button
            @click="handleUpdate(status)"
            class="text-sm font-medium text-emerald-600 hover:text-emerald-800 px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition-colors"
          >
            保存
          </button>
          <button
            @click="cancelEdit"
            class="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            取消
          </button>
        </template>
        <template v-else>
          <span class="flex-1 text-sm font-medium text-slate-800 dark:text-slate-200">{{ status.name }}</span>
          <!-- Move buttons -->
          <button
            @click="moveUp(status)"
            :disabled="index === 0"
            class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="上に移動"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 15l7-7 7 7" />
            </svg>
          </button>
          <button
            @click="moveDown(status)"
            :disabled="index === statuses.length - 1"
            class="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20 disabled:cursor-not-allowed p-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            title="下に移動"
          >
            <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <button
            @click="startEdit(status)"
            class="text-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
          >
            編集
          </button>
          <button
            @click="handleDelete(status)"
            class="text-sm text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            削除
          </button>
        </template>
      </li>
    </ul>
  </div>
</template>
