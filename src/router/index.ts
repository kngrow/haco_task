import { createRouter, createWebHistory } from "vue-router";
import TodayView from "../views/TodayView.vue";
import TasksView from "../views/TasksView.vue";
import MemosView from "../views/MemosView.vue";
import SettingsView from "../views/SettingsView.vue";

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: "/", name: "today", component: TodayView },
    { path: "/tasks", name: "tasks", component: TasksView },
    { path: "/memos", name: "memos", component: MemosView },
    { path: "/settings", name: "settings", component: SettingsView },
  ],
});

export default router;
