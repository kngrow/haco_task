<script setup lang="ts">
import AppLayout from "./components/common/AppLayout.vue";
import { useDarkMode } from "./composables/useDarkMode";

// Initialize dark mode at app startup
useDarkMode();
</script>

<template>
  <AppLayout />
</template>
