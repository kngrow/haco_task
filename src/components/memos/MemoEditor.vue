<script setup lang="ts">
import { ref, watch, onUnmounted, computed, nextTick } from "vue";
import MarkdownIt from "markdown-it";
import { openUrl } from "@tauri-apps/plugin-opener";
import type { Memo } from "../../types";

const props = defineProps<{
  memo: Memo | null;
}>();

const emit = defineEmits<{
  (e: "save", data: { id: number; title: string; content: string }): void;
}>();

const md = new MarkdownIt({
  html: false,
  linkify: true,
  typographer: true,
  breaks: true,
});

const title = ref("");
const content = ref("");
const mode = ref<"edit" | "preview">("edit");
const previewEl = ref<HTMLElement | null>(null);
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

watch(
  () => props.memo,
  (newMemo) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
      debounceTimer = null;
    }
    if (newMemo) {
      title.value = newMemo.title;
      content.value = newMemo.content || "";
    } else {
      title.value = "";
      content.value = "";
    }
  },
  { immediate: true }
);

const renderedHtml = computed(() => md.render(content.value));

// コードブロックにコピーボタンを追加
watch([renderedHtml, mode], async () => {
  if (mode.value !== "preview") return;
  await nextTick();
  if (!previewEl.value) return;
  previewEl.value.querySelectorAll("pre").forEach((pre) => {
    if (pre.querySelector(".copy-btn")) return; // 二重追加防止
    pre.style.position = "relative";
    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.textContent = "Copy";
    btn.addEventListener("click", async (e) => {
      e.stopPropagation();
      const code = pre.querySelector("code")?.innerText ?? pre.innerText;
      await navigator.clipboard.writeText(code);
      btn.textContent = "Copied!";
      setTimeout(() => (btn.textContent = "Copy"), 1500);
    });
    pre.appendChild(btn);
  });
});

function scheduleSave() {
  if (!props.memo) return;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    if (props.memo) {
      emit("save", {
        id: props.memo.id,
        title: title.value || "無題",
        content: content.value,
      });
    }
  }, 500);
}

function handlePreviewClick(e: MouseEvent) {
  const target = (e.target as HTMLElement).closest("a");
  if (target && target.href) {
    e.preventDefault();
    openUrl(target.href);
  }
}

onUnmounted(() => {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    if (props.memo) {
      emit("save", {
        id: props.memo.id,
        title: title.value || "無題",
        content: content.value,
      });
    }
  }
});
</script>

<template>
  <div v-if="!memo" class="h-full flex items-center justify-center text-slate-400 text-sm">
    <div class="text-center">
      <svg class="w-10 h-10 mx-auto mb-2 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      メモを選択してください
    </div>
  </div>
  <div v-else class="h-full flex flex-col">
    <!-- Header: タイトル + トグル -->
    <div class="px-5 py-2.5 border-b border-slate-200 dark:border-slate-700 flex items-center gap-3">
      <input
        v-model="title"
        class="flex-1 text-lg font-semibold bg-transparent border-none outline-none placeholder-slate-300 dark:placeholder-slate-600 text-slate-900 dark:text-slate-100 min-w-0"
        placeholder="タイトル"
        @input="scheduleSave"
      />
      <!-- Edit / Preview トグル -->
      <div class="flex items-center bg-slate-100 dark:bg-slate-800 rounded-lg p-0.5 shrink-0">
        <button
          @click="mode = 'edit'"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
          :class="mode === 'edit' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
        >
          Edit
        </button>
        <button
          @click="mode = 'preview'"
          class="px-3 py-1 text-xs font-medium rounded-md transition-colors"
          :class="mode === 'preview' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'"
        >
          Preview
        </button>
      </div>
    </div>

    <!-- Edit -->
    <textarea
      v-show="mode === 'edit'"
      v-model="content"
      class="flex-1 w-full resize-none p-4 text-sm font-mono bg-white dark:bg-slate-900 outline-none leading-relaxed text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-600"
      placeholder="Markdownで入力..."
      @input="scheduleSave"
    ></textarea>

    <!-- Preview -->
    <div
      ref="previewEl"
      v-show="mode === 'preview'"
      class="flex-1 overflow-y-auto p-5 prose prose-sm max-w-none"
      v-html="renderedHtml"
      @click="handlePreviewClick"
    ></div>
  </div>
</template>

<style scoped>
.prose :deep(h1) { font-size: 1.5em; font-weight: 700; margin-top: 0.5em; margin-bottom: 0.25em; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.25em; }
.prose :deep(h2) { font-size: 1.25em; font-weight: 600; margin-top: 0.5em; margin-bottom: 0.25em; border-bottom: 1px solid #f3f4f6; padding-bottom: 0.2em; }
.prose :deep(h3) { font-size: 1.1em; font-weight: 600; margin-top: 0.5em; margin-bottom: 0.25em; }
.prose :deep(p) { margin-top: 0.4em; margin-bottom: 0.4em; line-height: 1.7; }
.prose :deep(ul), .prose :deep(ol) { margin-top: 0.25em; margin-bottom: 0.25em; padding-left: 1.5em; }
.prose :deep(li) { margin-top: 0.1em; margin-bottom: 0.1em; }
.prose :deep(code) { background: #f1f5f9; padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.875em; }
.prose :deep(pre) { background: #1e293b; color: #e2e8f0; padding: 0.75em 1em; border-radius: 8px; overflow-x: auto; margin-top: 0.5em; margin-bottom: 0.5em; }
.prose :deep(pre code) { background: transparent; padding: 0; color: inherit; }
.prose :deep(blockquote) { border-left: 3px solid #cbd5e1; padding-left: 0.75em; color: #64748b; margin-top: 0.5em; margin-bottom: 0.5em; }
.prose :deep(a) { color: #6366f1; text-decoration: underline; }
.prose :deep(table) { border-collapse: collapse; width: 100%; margin-top: 0.5em; margin-bottom: 0.5em; }
.prose :deep(th), .prose :deep(td) { border: 1px solid #e2e8f0; padding: 0.4em 0.6em; text-align: left; }
.prose :deep(th) { background: #f8fafc; font-weight: 600; }
.prose :deep(hr) { border: none; border-top: 1px solid #e2e8f0; margin: 1em 0; }
.prose :deep(img) { max-width: 100%; border-radius: 6px; }

/* Dark mode prose overrides */
:global(.dark) .prose :deep(h1),
:global(.dark) .prose :deep(h2),
:global(.dark) .prose :deep(h3) { color: #e2e8f0; border-bottom-color: #334155; }
:global(.dark) .prose :deep(p) { color: #cbd5e1; }
:global(.dark) .prose :deep(ul),
:global(.dark) .prose :deep(ol) { color: #cbd5e1; }
:global(.dark) .prose :deep(li) { color: #cbd5e1; }
:global(.dark) .prose :deep(code) { background: #1e293b; color: #e2e8f0; }
:global(.dark) .prose :deep(pre) { background: #0f172a; }
:global(.dark) .prose :deep(blockquote) { border-left-color: #475569; color: #94a3b8; }
:global(.dark) .prose :deep(a) { color: #818cf8; }
:global(.dark) .prose :deep(th) { background: #1e293b; color: #e2e8f0; }
:global(.dark) .prose :deep(td) { color: #cbd5e1; border-color: #334155; }
:global(.dark) .prose :deep(th) { border-color: #334155; }
:global(.dark) .prose :deep(hr) { border-top-color: #334155; }

.prose :deep(pre .copy-btn) {
  position: absolute;
  top: 0.5em;
  right: 0.5em;
  padding: 0.2em 0.6em;
  font-size: 0.7em;
  font-family: inherit;
  color: #94a3b8;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 4px;
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  line-height: 1.4;
}
.prose :deep(pre .copy-btn:hover) {
  color: #e2e8f0;
  background: rgba(255, 255, 255, 0.15);
}
</style>
