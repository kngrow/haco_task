<script setup lang="ts">
import { ref, watch, computed, onMounted } from "vue";
import { useTasks } from "../../composables/useTasks";
import { useTaskTypes } from "../../composables/useTaskTypes";
import { addDays, diffDays, nextBusinessDay } from "../../utils/date";
import DatePicker from "../common/DatePicker.vue";
import type { Task, Status } from "../../types";

const props = defineProps<{
  editTask?: Task | null;
}>();

const emit = defineEmits<{
  close: [];
  saved: [];
}>();

const { createTask, updateTask, upsertTaskStatusDate, fetchTaskStatusDates, taskStatusDates } = useTasks();
const { taskTypes, statuses, fetchTaskTypes, fetchStatuses } = useTaskTypes();

const title = ref("");
const description = ref("");
const selectedTypeId = ref<number | null>(null);

const statusDates = ref<Record<number, { started_at: string; due_date: string; notes: string }>>({});

const isEditing = computed(() => !!props.editTask);

onMounted(async () => {
  await fetchTaskTypes();
  if (props.editTask) {
    title.value = props.editTask.title;
    description.value = props.editTask.description ?? "";
    selectedTypeId.value = props.editTask.task_type_id;
    if (props.editTask.task_type_id) {
      await fetchStatuses(props.editTask.task_type_id);
      await fetchTaskStatusDates(props.editTask.id);
      for (const s of statuses.value) {
        const existing = taskStatusDates.value.find((tsd) => tsd.status_id === s.id);
        statusDates.value[s.id] = {
          started_at: existing?.started_at ?? "",
          due_date: existing?.due_date ?? "",
          notes: existing?.notes ?? "",
        };
      }
    }
  }
});

watch(selectedTypeId, async (typeId) => {
  if (typeId) {
    await fetchStatuses(typeId);
    for (const s of statuses.value) {
      if (!statusDates.value[s.id]) {
        statusDates.value[s.id] = { started_at: "", due_date: "", notes: "" };
      }
    }
  } else {
    statuses.value = [];
    statusDates.value = {};
  }
});

// ステータスをposition順に並べた配列
const sortedStatuses = computed(() =>
  [...statuses.value].sort((a, b) => a.position - b.position)
);

function handleDateChange(
  statusId: number,
  field: "started_at" | "due_date",
  newVal: string,
  oldVal: string
) {
  const idx = sortedStatuses.value.findIndex((s) => s.id === statusId);
  if (idx === -1) return;

  // 新規入力（oldValが空）の場合
  if (!oldVal && newVal) {
    // due_date が新規入力 → 次ステータスの started_at が空なら翌営業日をセット
    if (field === "due_date" && idx + 1 < sortedStatuses.value.length) {
      const nextId = sortedStatuses.value[idx + 1].id;
      if (statusDates.value[nextId] && !statusDates.value[nextId].started_at) {
        statusDates.value[nextId].started_at = nextBusinessDay(newVal);
      }
    }
    return;
  }

  // 既存値を変更した場合 → 以降のステータスの日付をまとめてずらす
  if (oldVal && newVal) {
    const diff = diffDays(newVal, oldVal);
    if (diff === 0) return;
    for (let i = idx + 1; i < sortedStatuses.value.length; i++) {
      const sd = statusDates.value[sortedStatuses.value[i].id];
      if (!sd) continue;
      if (sd.started_at) sd.started_at = addDays(sd.started_at, diff);
      if (sd.due_date) sd.due_date = addDays(sd.due_date, diff);
    }
  }
}

async function handleSave() {
  const trimmedTitle = title.value.trim();
  if (!trimmedTitle) return;

  const desc = description.value.trim() || null;
  const typeId = selectedTypeId.value;
  let currentStatusId: number | null = null;
  if (typeId && statuses.value.length > 0 && !isEditing.value) {
    currentStatusId = statuses.value[0].id;
  }

  let taskId: number;
  if (isEditing.value && props.editTask) {
    taskId = props.editTask.id;
    await updateTask(taskId, trimmedTitle, desc);
  } else {
    taskId = await createTask(trimmedTitle, desc, typeId, currentStatusId);
  }

  if (typeId) {
    for (const s of statuses.value) {
      const sd = statusDates.value[s.id];
      if (sd) {
        await upsertTaskStatusDate(
          taskId,
          s.id,
          sd.started_at || null,
          sd.due_date || null,
          sd.notes || null
        );
      }
    }
  }

  emit("saved");
}
</script>

<template>
  <div class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" @click.self="emit('close')">
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <!-- Header -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
        <h2 class="text-base font-semibold text-slate-900 dark:text-slate-100">
          {{ isEditing ? "タスクを編集" : "新しいタスク" }}
        </h2>
        <button
          @click="emit('close')"
          class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg p-1.5 transition-colors"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Body -->
      <div class="px-6 py-5 space-y-4">
        <!-- Title -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">タイトル</label>
          <input
            v-model="title"
            type="text"
            class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="タスクのタイトル"
          />
        </div>

        <!-- Description -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">説明</label>
          <textarea
            v-model="description"
            rows="3"
            class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none placeholder-slate-400 dark:placeholder-slate-500"
            placeholder="タスクの説明（任意）"
          ></textarea>
        </div>

        <!-- Task Type -->
        <div>
          <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">タスクタイプ</label>
          <select
            v-model="selectedTypeId"
            class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
            :disabled="isEditing"
          >
            <option :value="null">-- 未選択（Inbox） --</option>
            <option v-for="tt in taskTypes" :key="tt.id" :value="tt.id">
              {{ tt.name }}
            </option>
          </select>
        </div>

        <!-- Status dates -->
        <div v-if="statuses.length > 0">
          <h3 class="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2.5">ステータス別の日付・メモ</h3>
          <div class="space-y-3">
            <div
              v-for="status in statuses"
              :key="status.id"
              class="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-xl p-3.5"
            >
              <h4 class="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2.5">{{ status.name }}</h4>
              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">開始日</label>
                  <DatePicker
                    :model-value="statusDates[status.id].started_at"
                    @update:model-value="(v) => { statusDates[status.id].started_at = v; }"
                    @change="(newVal, oldVal) => handleDateChange(status.id, 'started_at', newVal, oldVal)"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">期日</label>
                  <DatePicker
                    :model-value="statusDates[status.id].due_date"
                    @update:model-value="(v) => { statusDates[status.id].due_date = v; }"
                    @change="(newVal, oldVal) => handleDateChange(status.id, 'due_date', newVal, oldVal)"
                  />
                </div>
              </div>
              <div class="mt-2.5">
                <label class="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">メモ</label>
                <input
                  v-model="statusDates[status.id].notes"
                  type="text"
                  class="w-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-slate-400 dark:placeholder-slate-500"
                  placeholder="メモ（任意）"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex justify-end gap-2.5 px-6 py-4 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 rounded-b-2xl">
        <button
          @click="emit('close')"
          class="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
        >
          キャンセル
        </button>
        <button
          @click="handleSave"
          :disabled="!title.trim()"
          class="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {{ isEditing ? "更新" : "作成" }}
        </button>
      </div>
    </div>
  </div>
</template>
