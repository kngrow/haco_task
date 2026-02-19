<script setup lang="ts">
import { ref, watch } from "vue";
import FolderTree from "../components/memos/FolderTree.vue";
import MemoList from "../components/memos/MemoList.vue";
import MemoEditor from "../components/memos/MemoEditor.vue";
import { useMemos } from "../composables/useMemos";
import type { Memo } from "../types";

const { memos, fetchMemos, createMemo, updateMemo, deleteMemo } = useMemos();

const selectedFolderId = ref<number | null>(null);
const selectedMemo = ref<Memo | null>(null);
const folderTreeRef = ref<InstanceType<typeof FolderTree> | null>(null);

const isInitialLoad = ref(true);

watch(
  selectedFolderId,
  async () => {
    await fetchMemos(selectedFolderId.value);
    if (selectedMemo.value) {
      const stillExists = memos.value.find((m) => m.id === selectedMemo.value!.id);
      if (!stillExists) {
        selectedMemo.value = null;
      } else {
        selectedMemo.value = stillExists;
      }
    }
  },
  { immediate: true }
);

function onFolderSelect(folderId: number | null) {
  selectedFolderId.value = folderId;
}

function onMemoSelect(memo: Memo) {
  selectedMemo.value = memo;
}

async function onCreateMemo() {
  const newId = await createMemo("無題", "", selectedFolderId.value);
  await fetchMemos(selectedFolderId.value);
  const newMemo = memos.value.find((m) => m.id === newId);
  if (newMemo) {
    selectedMemo.value = newMemo;
  }
}

async function onDeleteMemo(id: number) {
  await deleteMemo(id);
  if (selectedMemo.value?.id === id) {
    selectedMemo.value = null;
  }
  await fetchMemos(selectedFolderId.value);
}

async function onSaveMemo(data: { id: number; title: string; content: string }) {
  await updateMemo(data.id, data.title, data.content);
  await fetchMemos(selectedFolderId.value);
  const updated = memos.value.find((m) => m.id === data.id);
  if (updated) {
    selectedMemo.value = updated;
  }
}
</script>

<template>
  <div class="h-full flex -m-6">
    <!-- Folder Tree (left pane) -->
    <div class="w-56 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
      <FolderTree ref="folderTreeRef" @select="onFolderSelect" />
    </div>

    <!-- Memo List (center pane) -->
    <div class="w-64 shrink-0 border-r border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
      <MemoList
        :memos="memos"
        :selected-memo-id="selectedMemo?.id ?? null"
        @select="onMemoSelect"
        @create="onCreateMemo"
        @delete="onDeleteMemo"
      />
    </div>

    <!-- Editor + Preview (right pane) -->
    <div class="flex-1 min-w-0 bg-white dark:bg-slate-900">
      <MemoEditor
        :memo="selectedMemo"
        @save="onSaveMemo"
      />
    </div>
  </div>
</template>
