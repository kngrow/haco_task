<script setup lang="ts">
import { computed } from "vue";
import { useConfirm } from "../../composables/useConfirm";
import type { Memo } from "../../types";

const props = defineProps<{
  memos: Memo[];
  selectedMemoId: number | null;
}>();

const emit = defineEmits<{
  (e: "select", memo: Memo): void;
  (e: "create"): void;
  (e: "delete", id: number): void;
}>();

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hours = String(d.getHours()).padStart(2, "0");
  const mins = String(d.getMinutes()).padStart(2, "0");
  return `${year}/${month}/${day} ${hours}:${mins}`;
}

const { confirm } = useConfirm();

async function handleDelete(e: Event, id: number) {
  e.stopPropagation();
  if (await confirm("このメモを削除しますか？")) {
    emit("delete", id);
  }
}
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
      <h2 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">メモ</h2>
      <button
        class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
        title="新規メモ"
        @click="emit('create')"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto">
      <div v-if="memos.length === 0" class="px-3 py-6 text-sm text-slate-400 dark:text-slate-500 text-center">
        メモがありません
      </div>
      <button
        v-for="memo in memos"
        :key="memo.id"
        class="group w-full text-left px-3 py-2.5 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
        :class="{
          'bg-indigo-50 dark:bg-indigo-900/30 border-l-2 border-l-indigo-500': selectedMemoId === memo.id,
        }"
        @click="emit('select', memo)"
      >
        <div class="flex items-start justify-between gap-1">
          <h3
            class="text-sm font-medium truncate flex-1"
            :class="selectedMemoId === memo.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-800 dark:text-slate-200'"
          >
            {{ memo.title || "無題" }}
          </h3>
          <button
            class="hidden group-hover:flex p-0.5 text-slate-300 dark:text-slate-600 hover:text-red-400 shrink-0 rounded transition-colors"
            title="削除"
            @click="handleDelete($event, memo.id)"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
          {{ formatDate(memo.updated_at || memo.created_at) }}
        </p>
      </button>
    </div>
  </div>
</template>
