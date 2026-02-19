<script setup lang="ts">
import { useRoute } from "vue-router";
import AppNav from "./AppNav.vue";

const route = useRoute();
</script>

<template>
  <div class="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
    <AppNav />
    <main class="flex-1 overflow-auto p-6">
      <router-view />
    </main>
  </div>
</template>
