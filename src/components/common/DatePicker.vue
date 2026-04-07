<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from "vue";

const props = defineProps<{
  modelValue: string;
  placeholder?: string;
  clearable?: boolean;
}>();

const emit = defineEmits<{
  "update:modelValue": [value: string];
  change: [newVal: string, oldVal: string];
}>();

const open = ref(false);
const root = ref<HTMLElement | null>(null);

// 表示用の年月
const viewYear = ref(new Date().getFullYear());
const viewMonth = ref(new Date().getMonth()); // 0-based

// modelValue から年月を初期化
watch(
  () => props.modelValue,
  (val) => {
    if (val) {
      const [y, m] = val.split("-").map(Number);
      viewYear.value = y;
      viewMonth.value = m - 1;
    }
  },
  { immediate: true }
);

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const MONTHS = ["1月","2月","3月","4月","5月","6月","7月","8月","9月","10月","11月","12月"];

// カレンダーのセル（前月末尾・当月・翌月頭を含む42マス）
const calendarDays = computed(() => {
  const firstDay = new Date(viewYear.value, viewMonth.value, 1).getDay();
  const daysInMonth = new Date(viewYear.value, viewMonth.value + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear.value, viewMonth.value, 0).getDate();

  const cells: { date: string; currentMonth: boolean }[] = [];

  // 前月の末尾
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    const m = viewMonth.value === 0 ? 12 : viewMonth.value;
    const y = viewMonth.value === 0 ? viewYear.value - 1 : viewYear.value;
    cells.push({ date: fmt(y, m, d), currentMonth: false });
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ date: fmt(viewYear.value, viewMonth.value + 1, d), currentMonth: true });
  }

  // 翌月の先頭
  const remaining = 42 - cells.length;
  for (let d = 1; d <= remaining; d++) {
    const m = viewMonth.value === 11 ? 1 : viewMonth.value + 2;
    const y = viewMonth.value === 11 ? viewYear.value + 1 : viewYear.value;
    cells.push({ date: fmt(y, m, d), currentMonth: false });
  }

  return cells;
});

function fmt(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function dayOfWeek(dateStr: string): number {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).getDay();
}

const today = fmt(new Date().getFullYear(), new Date().getMonth() + 1, new Date().getDate());

function prevMonth() {
  if (viewMonth.value === 0) { viewMonth.value = 11; viewYear.value--; }
  else viewMonth.value--;
}

function nextMonth() {
  if (viewMonth.value === 11) { viewMonth.value = 0; viewYear.value++; }
  else viewMonth.value++;
}

function select(dateStr: string) {
  const old = props.modelValue;
  emit("update:modelValue", dateStr);
  emit("change", dateStr, old);
  open.value = false;
}

function clear() {
  const old = props.modelValue;
  emit("update:modelValue", "");
  emit("change", "", old);
  open.value = false;
}

const displayValue = computed(() => {
  if (!props.modelValue) return "";
  const [y, m, d] = props.modelValue.split("-").map(Number);
  return `${y}/${m}/${d}`;
});

// 外側クリックで閉じる
function onClickOutside(e: MouseEvent) {
  if (root.value && !root.value.contains(e.target as Node)) {
    open.value = false;
  }
}

onMounted(() => document.addEventListener("mousedown", onClickOutside));
onUnmounted(() => document.removeEventListener("mousedown", onClickOutside));
</script>

<template>
  <div ref="root" class="relative group/datepicker">
    <!-- トリガー -->
    <button
      type="button"
      @click="open = !open"
      class="w-full flex items-center justify-between gap-2 border rounded-lg px-2.5 py-2 text-sm transition-all"
      :class="
        open
          ? 'border-indigo-500 ring-2 ring-indigo-500/30 bg-white dark:bg-slate-700'
          : 'border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 hover:border-slate-400 dark:hover:border-slate-500'
      "
    >
      <span :class="displayValue ? 'text-slate-700 dark:text-slate-200' : 'text-slate-400 dark:text-slate-500'">
        {{ displayValue || placeholder || "日付を選択" }}
      </span>
      <span class="flex items-center gap-1 shrink-0">
        <button
          v-if="modelValue && clearable !== false"
          type="button"
          @click.stop="clear"
          class="text-slate-300 hover:text-slate-500 dark:text-slate-500 dark:hover:text-slate-300 transition-colors opacity-0 group-hover/datepicker:opacity-100"
        >
          <svg class="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <svg class="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.75">
          <path stroke-linecap="round" stroke-linejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </span>
    </button>

    <!-- カレンダードロップダウン -->
    <div
      v-if="open"
      class="absolute z-50 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-xl shadow-xl p-3 w-64"
    >
      <!-- ヘッダー：月ナビ -->
      <div class="flex items-center justify-between mb-2">
        <button type="button" @click="prevMonth"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <span class="text-sm font-semibold text-slate-800 dark:text-slate-100">
          {{ viewYear }}年 {{ MONTHS[viewMonth] }}
        </span>
        <button type="button" @click="nextMonth"
          class="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
          <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      <!-- 曜日ヘッダー -->
      <div class="grid grid-cols-7 mb-1">
        <div
          v-for="(wd, i) in WEEKDAYS" :key="wd"
          class="text-center text-xs font-medium py-1"
          :class="i === 0 ? 'text-red-400' : i === 6 ? 'text-blue-400' : 'text-slate-400 dark:text-slate-500'"
        >
          {{ wd }}
        </div>
      </div>

      <!-- 日付グリッド -->
      <div class="grid grid-cols-7 gap-y-0.5">
        <button
          v-for="cell in calendarDays"
          :key="cell.date"
          type="button"
          @click="select(cell.date)"
          class="h-8 w-full rounded-lg text-xs font-medium transition-colors"
          :class="[
            cell.date === modelValue
              ? 'bg-indigo-600 text-white'
              : cell.date === today
              ? 'border border-indigo-400 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/30'
              : cell.currentMonth
              ? dayOfWeek(cell.date) === 0
                ? 'text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20'
                : dayOfWeek(cell.date) === 6
                ? 'text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700'
              : 'text-slate-300 dark:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50',
          ]"
        >
          {{ cell.date.split("-")[2].replace(/^0/, "") }}
        </button>
      </div>

      <!-- 今日ボタン -->
      <div class="mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 text-center">
        <button
          type="button"
          @click="select(today)"
          class="text-xs font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 px-3 py-1 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition-colors"
        >
          今日
        </button>
      </div>
    </div>
  </div>
</template>
