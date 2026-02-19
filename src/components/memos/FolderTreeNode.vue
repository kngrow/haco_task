<script setup lang="ts">

interface FolderNode {
  folder: { id: number; name: string; parent_id: number | null };
  children: FolderNode[];
  expanded: boolean;
}

const props = defineProps<{
  node: FolderNode;
  depth: number;
  selectedFolderId: number | null;
  editingFolderId: number | null;
  editingFolderName: string;
  showNewFolderInput: boolean;
  newFolderParentId: number | null;
  newFolderName: string;
}>();

const emit = defineEmits<{
  (e: "select", id: number): void;
  (e: "toggle", id: number): void;
  (e: "start-new", parentId: number): void;
  (e: "start-edit", folder: { id: number; name: string; parent_id: number | null }): void;
  (e: "delete", id: number): void;
  (e: "confirm-edit"): void;
  (e: "cancel-edit"): void;
  (e: "update:editing-name", val: string): void;
  (e: "confirm-new"): void;
  (e: "cancel-new"): void;
  (e: "update:new-name", val: string): void;
}>();

const paddingLeft = `${props.depth * 16 + 12}px`;
</script>

<template>
  <div>
    <div
      class="group flex items-center gap-1 py-1.5 pr-2 text-sm cursor-pointer rounded-lg mx-1 transition-colors"
      :class="
        selectedFolderId === node.folder.id
          ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100'
      "
      :style="{ paddingLeft }"
      @click="emit('select', node.folder.id)"
    >
      <!-- Expand toggle -->
      <button
        v-if="node.children.length > 0"
        class="p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 shrink-0 rounded"
        @click.stop="emit('toggle', node.folder.id)"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-3 w-3 transition-transform"
          :class="{ 'rotate-90': node.expanded }"
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
        </svg>
      </button>
      <span v-else class="w-4 shrink-0"></span>

      <!-- Folder icon -->
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
        <path stroke-linecap="round" stroke-linejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
      </svg>

      <!-- Editing mode -->
      <template v-if="editingFolderId === node.folder.id">
        <input
          :value="editingFolderName"
          @input="emit('update:editing-name', ($event.target as HTMLInputElement).value)"
          class="flex-1 min-w-0 text-sm border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-1.5 py-0.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
          @keydown.enter="emit('confirm-edit')"
          @keydown.escape="emit('cancel-edit')"
          @click.stop
          autofocus
        />
      </template>
      <template v-else>
        <span class="truncate flex-1">{{ node.folder.name }}</span>
      </template>

      <!-- Action buttons -->
      <div v-if="editingFolderId !== node.folder.id" class="hidden group-hover:flex items-center gap-0.5 shrink-0">
        <button
          class="p-0.5 text-slate-400 hover:text-indigo-500 rounded"
          title="サブフォルダを追加"
          @click.stop="emit('start-new', node.folder.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M12 4v16m8-8H4" />
          </svg>
        </button>
        <button
          class="p-0.5 text-slate-400 hover:text-amber-500 rounded"
          title="名前を変更"
          @click.stop="emit('start-edit', node.folder)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
          </svg>
        </button>
        <button
          class="p-0.5 text-slate-400 hover:text-red-400 rounded"
          title="削除"
          @click.stop="emit('delete', node.folder.id)"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>

    <!-- New subfolder input -->
    <div v-if="showNewFolderInput && newFolderParentId === node.folder.id" :style="{ paddingLeft: `${(depth + 1) * 16 + 12}px` }" class="pr-2 py-1">
      <input
        :value="newFolderName"
        @input="emit('update:new-name', ($event.target as HTMLInputElement).value)"
        class="w-full text-sm border border-indigo-300 dark:border-indigo-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-400"
        placeholder="フォルダ名"
        @keydown.enter="emit('confirm-new')"
        @keydown.escape="emit('cancel-new')"
        autofocus
      />
      <div class="flex gap-1.5 mt-1">
        <button class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800" @click="emit('confirm-new')">作成</button>
        <button class="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-700" @click="emit('cancel-new')">キャンセル</button>
      </div>
    </div>

    <!-- Children -->
    <template v-if="node.expanded">
      <FolderTreeNode
        v-for="child in node.children"
        :key="child.folder.id"
        :node="child"
        :depth="depth + 1"
        :selected-folder-id="selectedFolderId"
        :editing-folder-id="editingFolderId"
        :editing-folder-name="editingFolderName"
        :show-new-folder-input="showNewFolderInput"
        :new-folder-parent-id="newFolderParentId"
        :new-folder-name="newFolderName"
        @select="emit('select', $event)"
        @toggle="emit('toggle', $event)"
        @start-new="emit('start-new', $event)"
        @start-edit="emit('start-edit', $event)"
        @delete="emit('delete', $event)"
        @confirm-edit="emit('confirm-edit')"
        @cancel-edit="emit('cancel-edit')"
        @update:editing-name="emit('update:editing-name', $event)"
        @confirm-new="emit('confirm-new')"
        @cancel-new="emit('cancel-new')"
        @update:new-name="emit('update:new-name', $event)"
      />
    </template>
  </div>
</template>

<script lang="ts">
export default {
  name: "FolderTreeNode",
};
</script>
