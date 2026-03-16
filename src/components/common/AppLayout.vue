<script setup lang="ts">
import { computed } from "vue";
import { RouterLink, useRoute } from "vue-router";
import AppNav from "./AppNav.vue";
import ConfirmDialog from "./ConfirmDialog.vue";

const route = useRoute();
const isMemosSection = computed(() => route.path.startsWith("/memos"));
</script>

<template>
  <div class="flex flex-col h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <!-- Main area -->
    <div class="flex flex-1 overflow-hidden">
      <!-- Left sidebar (hidden on Memos) -->
      <AppNav v-if="!isMemosSection" />

      <!-- Content -->
      <main class="flex-1 overflow-auto p-6">
        <router-view />
      </main>
    </div>

    <ConfirmDialog />

    <!-- Bottom tab bar -->
    <nav class="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 shrink-0">
      <ul class="flex items-stretch h-14">
        <!-- Main section -->
        <li class="flex-1">
          <RouterLink v-slot="{ navigate }" to="/" custom>
            <a
              @click="navigate"
              :class="[
                'flex flex-col items-center justify-center gap-1 h-full text-xs transition-colors cursor-pointer',
                !isMemosSection
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

        <!-- Memos section -->
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
      </ul>
    </nav>
  </div>
</template>
