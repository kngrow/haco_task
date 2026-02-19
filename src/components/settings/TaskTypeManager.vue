<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useTaskTypes } from "../../composables/useTaskTypes";
import type { TaskType } from "../../types";

const emit = defineEmits<{
  selectType: [taskType: TaskType];
}>();

const { taskTypes, fetchTaskTypes, createTaskType, updateTaskType, deleteTaskType } = useTaskTypes();

const newTypeName = ref("");
const editingId = ref<number | null>(null);
const editingName = ref("");

onMounted(() => {
  fetchTaskTypes();
});

async function handleCreate() {
  const name = newTypeName.value.trim();
  if (!name) return;
  await createTaskType(name);
  newTypeName.value = "";
}

function startEdit(tt: TaskType) {
  editingId.value = tt.id;
  editingName.value = tt.name;
}

function cancelEdit() {
  editingId.value = null;
  editingName.value = "";
}

async function handleUpdate() {
  if (!editingId.value || !editingName.value.trim()) return;
  await updateTaskType(editingId.value, editingName.value.trim());
  cancelEdit();
}

async function handleDelete(tt: TaskType) {
  if (!confirm(`タスクタイプ「${tt.name}」を削除しますか？関連するステータスも削除されます。`)) return;
  await deleteTaskType(tt.id);
}
</script>

<template>
  <div>
    <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">タスクタイプ</h3>

    <!-- Add new type -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="newTypeName"
        type="text"
        placeholder="新しいタスクタイプ名"
        class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-slate-400 dark:placeholder-slate-500"
        @keydown.enter="handleCreate"
      />
      <button
        @click="handleCreate"
        :disabled="!newTypeName.trim()"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        追加
      </button>
    </div>

    <!-- Type list -->
    <div v-if="taskTypes.length === 0" class="text-sm text-slate-400 dark:text-slate-500 py-2">
      タスクタイプがありません。上から追加してください。
    </div>
    <ul class="space-y-2">
      <li
        v-for="tt in taskTypes"
        :key="tt.id"
        class="flex items-center gap-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3"
      >
        <template v-if="editingId === tt.id">
          <input
            v-model="editingName"
            type="text"
            class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            @keydown.enter="handleUpdate"
            @keydown.escape="cancelEdit"
          />
          <button
            @click="handleUpdate"
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
          <button
            @click="emit('selectType', tt)"
            class="flex-1 text-left text-sm font-medium text-slate-800 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
          >
            {{ tt.name }}
          </button>
          <button
            @click="startEdit(tt)"
            class="text-sm text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 px-2 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
          >
            編集
          </button>
          <button
            @click="handleDelete(tt)"
            class="text-sm text-slate-400 hover:text-red-500 px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
          >
            削除
          </button>
        </template>
      </li>
    </ul>
  </div>
</template>
