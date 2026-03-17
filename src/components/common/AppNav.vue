<script setup lang="ts">
import { RouterLink } from "vue-router";
import MiniCalendar from "./MiniCalendar.vue";
</script>

<template>
  <nav class="w-56 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col shrink-0">
    <!-- App header -->
    <div class="px-4 py-4 border-b border-slate-100 dark:border-slate-700/60">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center shrink-0">
          <svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
          </svg>
        </div>
        <span class="text-sm font-semibold text-slate-900 dark:text-slate-100 tracking-tight">Hako Task</span>
      </div>
    </div>

    <MiniCalendar />

    <!-- Nav items -->
    <ul class="flex-1 px-2 py-2 space-y-0.5">
      <!-- Today -->
      <li>
        <RouterLink v-slot="{ isExactActive, navigate }" to="/" custom>
          <a
            @click="navigate"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
              isExactActive
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
            ]"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Today
          </a>
        </RouterLink>
      </li>

      <!-- Tasks -->
      <li>
        <RouterLink v-slot="{ isActive, navigate }" to="/tasks" custom>
          <a
            @click="navigate"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
            ]"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Tasks
          </a>
        </RouterLink>
      </li>

      <!-- Settings -->
      <li>
        <RouterLink v-slot="{ isActive, navigate }" to="/settings" custom>
          <a
            @click="navigate"
            :class="[
              'flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors cursor-pointer',
              isActive
                ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100',
            ]"
          >
            <svg class="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
              <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            タイプ設定
          </a>
        </RouterLink>
      </li>
    </ul>
  </nav>
</template>
