<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter, useRoute } from "vue-router";

const router = useRouter();
const route = useRoute();

const today = toDateStr(new Date());

const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth());

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

const selectedDate = computed(() => (route.path === "/" ? (route.query.date as string) || today : null));

const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay();
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
  const daysInPrev = new Date(viewYear.value, viewMonth.value, 0).getDate();
  const cells: { date: string; current: boolean }[] = [];

  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ date: toDateStr2(viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value, viewMonth.value === 0 ? 12 : viewMonth.value, daysInPrev - i), current: false });

  for (let d = 1; d <= daysInMonth; d++)
    cells.push({ date: toDateStr2(viewYear.value, viewMonth.value + 1, d), current: true });

  const rem = 42 - cells.length;
  for (let d = 1; d <= rem; d++)
    cells.push({ date: toDateStr2(viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value, viewMonth.value === 11 ? 1 : viewMonth.value + 2, d), current: false });

  return cells;
});

function toDateStr(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function toDateStr2(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function dow(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
  else viewMonth.value--;
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
  else viewMonth.value++;
}

function selectDate(date: string) {
  if (date === today) router.push("/");
  else router.push({ path: "/", query: { date } });
}
</script>

<template>
  <div class="px-2 py-2 border-t border-slate-100 dark:border-slate-700/60">
    <!-- 月ナビ -->
    <div class="flex items-center justify-between mb-1.5">
      <button @click="prevMonth" class="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
      <span class="text-xs font-semibold text-slate-600 dark:text-slate-300">
        {{ viewYear }}/{{ String(viewMonth + 1).padStart(2, "0") }}
      </span>
      <button @click="nextMonth" class="p-0.5 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
        <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
          <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>

    <!-- 曜日ヘッダー -->
    <div class="grid grid-cols-7 mb-0.5">
      <div v-for="(wd, i) in WEEKDAYS" :key="wd"
        class="text-center text-[10px] font-medium py-0.5"
        :class="i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'"
      >{{ wd }}</div>
    </div>

    <!-- 日付グリッド -->
    <div class="grid grid-cols-7 gap-y-0.5">
      <button
        v-for="cell in calendarDays"
        :key="cell.date"
        @click="selectDate(cell.date)"
        class="h-6 w-full rounded text-[11px] font-medium transition-colors"
        :class="[
          cell.date === selectedDate
            ? 'bg-indigo-600 text-white'
            : cell.date === today
            ? 'border border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
            : cell.current
            ? dow(cell.date) === 0
              ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
              : dow(cell.date) === 6
              ? 'text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'
            : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50',
        ]"
      >
        {{ Number(cell.date.split("-")[2]) }}
      </button>
    </div>
  </div>
</template>
