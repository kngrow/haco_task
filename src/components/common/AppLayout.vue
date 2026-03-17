<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AppNav from "./AppNav.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

const route = useRoute();
const isTasksSection = computed(() => !route.path.startsWith("/memos") && !route.path.startsWith("/app-settings"));
const isMemosSection = computed(() => route.path.startsWith("/memos"));
const isAppSettings = computed(() => route.path.startsWith("/app-settings"));
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <!-- Main area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left sidebar (Tasks section only) -->
      <AppNav v-if="isTasksSection" />

      <!-- Content -->
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>

    <ConfirmDialog />

    <!-- Bottom tab bar -->
    <nav class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shrink-0">
      <ul class="flex items-stretch h-14">
        <!-- Tasks -->
        <li class="flex-1">
          <RouterLink v-slot="{ navigate }" to="/" custom>
            <a
              @click="navigate"
              :class="[
                'flex flex-col items-center justify-center gap-1 h-full text-xs transition-colors cursor-pointer',
                isTasksSection
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              Tasks
            </a>
          </RouterLink>
        </li>

        <!-- Memos -->
        <li class="flex-1">
          <RouterLink v-slot="{ navigate }" to="/memos" custom>
            <a
              @click="navigate"
              :class="[
                'flex flex-col items-center justify-center gap-1 h-full text-xs transition-colors cursor-pointer',
                isMemosSection
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              Memos
            </a>
          </RouterLink>
        </li>

        <!-- App Settings -->
        <li class="flex-1">
          <RouterLink v-slot="{ navigate }" to="/app-settings" custom>
            <a
              @click="navigate"
              :class="[
                'flex flex-col items-center justify-center gap-1 h-full text-xs transition-colors cursor-pointer',
                isAppSettings
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100',
              ]"
            >
              <svg class="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
                <path stroke-linecap="round" stroke-linejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              設定
            </a>
          </RouterLink>
        </li>
      </ul>
    </nav>
  </div>
</template>
