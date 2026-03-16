<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useFolders } from "../../composables/useFolders";
import { useConfirm } from "../../composables/useConfirm";
import type { Folder } from "../../types";

const emit = defineEmits<{
  (e: "select", folderId: number | null): void;
}>();

const { folders, fetchFolders, createFolder, updateFolder, deleteFolder } = useFolders();
const { confirm } = useConfirm();

const selectedFolderId = ref<number | null>(null);
const showNewFolderInput = ref(false);
const newFolderName = ref("");
const newFolderParentId = ref<number | null>(null);
const editingFolderId = ref<number | null>(null);
const editingFolderName = ref("");

interface FolderNode {
  folder: Folder;
  children: FolderNode[];
  expanded: boolean;
}

const expandedIds = ref<Set<number>>(new Set());

const folderTree = computed<FolderNode[]>(() => {
  const map = new Map<number | null, Folder[]>();
  for (const f of folders.value) {
    const pid = f.parent_id;
    if (!map.has(pid)) map.set(pid, []);
    map.get(pid)!.push(f);
  }

  function buildNodes(parentId: number | null): FolderNode[] {
    const children = map.get(parentId) || [];
    return children.map((f) => ({
      folder: f,
      children: buildNodes(f.id),
      expanded: expandedIds.value.has(f.id),
    }));
  }

  return buildNodes(null);
});

function selectFolder(folderId: number | null) {
  selectedFolderId.value = folderId;
  emit("select", folderId);
}

function toggleExpand(folderId: number) {
  if (expandedIds.value.has(folderId)) {
    expandedIds.value.delete(folderId);
  } else {
    expandedIds.value.add(folderId);
  }
}

function startNewFolder(parentId: number | null) {
  showNewFolderInput.value = true;
  newFolderParentId.value = parentId;
  newFolderName.value = "";
}

async function confirmNewFolder() {
  const name = newFolderName.value.trim();
  if (!name) return;
  await createFolder(name, newFolderParentId.value);
  showNewFolderInput.value = false;
  newFolderName.value = "";
  if (newFolderParentId.value !== null) {
    expandedIds.value.add(newFolderParentId.value);
  }
}

function cancelNewFolder() {
  showNewFolderInput.value = false;
  newFolderName.value = "";
}

function startEditFolder(folder: Folder) {
  editingFolderId.value = folder.id;
  editingFolderName.value = folder.name;
}

async function confirmEditFolder() {
  if (editingFolderId.value === null) return;
  const name = editingFolderName.value.trim();
  if (!name) return;
  await updateFolder(editingFolderId.value, name);
  editingFolderId.value = null;
  editingFolderName.value = "";
}

function cancelEditFolder() {
  editingFolderId.value = null;
  editingFolderName.value = "";
}

async function handleDeleteFolder(folderId: number) {
  if (!(await confirm("このフォルダを削除しますか？フォルダ内のメモはルートに移動されます。"))) return;
  await deleteFolder(folderId);
  if (selectedFolderId.value === folderId) {
    selectFolder(null);
  }
}

onMounted(() => {
  fetchFolders();
});

defineExpose({ refresh: fetchFolders });
</script>

<template>
  <div class="h-full flex flex-col">
    <div class="flex items-center justify-between px-3 py-2.5 border-b border-slate-200 dark:border-slate-700">
      <h2 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">フォルダ</h2>
      <button
        class="text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 p-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/50 transition-colors"
        title="新規フォルダ"
        @click="startNewFolder(null)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      </button>
    </div>

    <div class="flex-1 overflow-y-auto py-1">
      <!-- Root item -->
      <button
        class="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 rounded-lg mx-1 transition-colors"
        :class="
          selectedFolderId === null
            ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
        "
        @click="selectFolder(null)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        すべてのメモ
      </button>

      <!-- New folder input at root level -->
      <div v-if="showNewFolderInput && newFolderParentId === null" class="px-3 py-1.5">
        <input
          v-model="newFolderName"
          class="w-full text-sm border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          placeholder="フォルダ名"
          @keydown.enter="confirmNewFolder"
          @keydown.escape="cancelNewFolder"
          autofocus
        />
        <div class="flex gap-1.5 mt-1.5">
          <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800" @click="confirmNewFolder">作成</button>
          <button class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700" @click="cancelNewFolder">キャンセル</button>
        </div>
      </div>

      <!-- Folder tree -->
      <template v-for="node in folderTree" :key="node.folder.id">
        <FolderTreeNode
          :node="node"
          :depth="0"
          :selected-folder-id="selectedFolderId"
          :editing-folder-id="editingFolderId"
          :editing-folder-name="editingFolderName"
          :show-new-folder-input="showNewFolderInput"
          :new-folder-parent-id="newFolderParentId"
          :new-folder-name="newFolderName"
          @select="selectFolder"
          @toggle="toggleExpand"
          @start-new="startNewFolder"
          @start-edit="startEditFolder"
          @delete="handleDeleteFolder"
          @confirm-edit="confirmEditFolder"
          @cancel-edit="cancelEditFolder"
          @update:editing-name="editingFolderName = $event"
          @confirm-new="confirmNewFolder"
          @cancel-new="cancelNewFolder"
          @update:new-name="newFolderName = $event"
        />
      </template>
    </div>
  </div>
</template>

<script lang="ts">
import FolderTreeNode from "./FolderTreeNode.vue";
</script>
