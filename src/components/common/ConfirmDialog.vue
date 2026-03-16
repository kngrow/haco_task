<script setup lang="ts">
import { useConfirm } from "../../composables/useConfirm";

const { isOpen, message, accept, cancel } = useConfirm();
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50"
      @click.self="cancel"
    >
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm p-5 flex flex-col gap-4">
        <p class="text-sm text-slate-800 dark:text-slate-100">{{ message }}</p>
        <div class="flex justify-end gap-2">
          <button
            @click="cancel"
            class="text-sm px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            キャンセル
          </button>
          <button
            @click="accept"
            class="text-sm px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors"
          >
            削除
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
