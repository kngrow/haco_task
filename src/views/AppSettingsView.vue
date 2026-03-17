<script setup lang="ts">
import { ref } from "vue";
import { getVersion } from "@tauri-apps/api/app";
import { useDarkMode } from "../composables/useDarkMode";

const { isDark, toggle } = useDarkMode();
const version = ref("");
getVersion().then((v) => (version.value = v));
</script>

<template>
  <div class="max-w-lg">
    <h1 class="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-6">設定</h1>

    <div class="space-y-4">
      <!-- Theme -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">テーマ</h3>
        <div class="flex items-center justify-between">
          <div>
            <p class="text-sm font-medium text-slate-700 dark:text-slate-300">ダークモード</p>
            <p class="text-xs text-slate-400 dark:text-slate-500 mt-0.5">アプリ全体の配色を切り替えます</p>
          </div>
          <button
            @click="toggle"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none"
            :class="isDark ? 'bg-indigo-600' : 'bg-slate-200'"
            :aria-pressed="isDark"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform"
              :class="isDark ? 'translate-x-6' : 'translate-x-1'"
            />
          </button>
        </div>
      </div>

      <!-- About -->
      <div class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5">
        <h3 class="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">アプリ情報</h3>
        <div class="flex items-center justify-between text-sm">
          <span class="text-slate-500 dark:text-slate-400">バージョン</span>
          <span class="font-medium text-slate-700 dark:text-slate-300">v{{ version }}</span>
        </div>
      </div>
    </div>
  </div>
</template>
