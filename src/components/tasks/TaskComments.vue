<script setup lang="ts">
import { ref, onMounted, watch } from "vue";
import { useTasks } from "../../composables/useTasks";
import type { TaskComment } from "../../types";

const props = defineProps<{
  taskId: number;
}>();

const { comments, fetchComments, addComment, deleteComment } = useTasks();
const newComment = ref("");

onMounted(() => {
  fetchComments(props.taskId);
});

watch(
  () => props.taskId,
  (id) => fetchComments(id)
);

async function handleAdd() {
  const content = newComment.value.trim();
  if (!content) return;
  await addComment(props.taskId, content);
  newComment.value = "";
}

async function handleDelete(comment: TaskComment) {
  if (!confirm("このコメントを削除しますか？")) return;
  await deleteComment(comment.id, props.taskId);
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
</script>

<template>
  <div>
    <h4 class="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-3">コメント</h4>

    <!-- Add comment -->
    <div class="flex gap-2 mb-4">
      <input
        v-model="newComment"
        type="text"
        placeholder="コメントを追加..."
        class="flex-1 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow placeholder-slate-400 dark:placeholder-slate-500"
        @keydown.enter="handleAdd"
      />
      <button
        @click="handleAdd"
        :disabled="!newComment.trim()"
        class="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        追加
      </button>
    </div>

    <!-- Comments list -->
    <div v-if="comments.length === 0" class="text-sm text-slate-400 dark:text-slate-500 text-center py-4">
      コメントはありません
    </div>
    <ul class="space-y-2.5">
      <li
        v-for="comment in comments"
        :key="comment.id"
        class="bg-slate-50 dark:bg-slate-700/50 border border-slate-100 dark:border-slate-600 rounded-xl p-3.5 text-sm group"
      >
        <div class="flex justify-between items-start gap-2">
          <p class="text-slate-800 dark:text-slate-200 whitespace-pre-wrap flex-1 leading-relaxed">{{ comment.content }}</p>
          <button
            @click="handleDelete(comment)"
            class="text-slate-300 dark:text-slate-600 hover:text-red-400 shrink-0 p-0.5 rounded transition-colors opacity-0 group-hover:opacity-100"
            title="削除"
          >
            <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p class="text-xs text-slate-400 dark:text-slate-500 mt-1.5">{{ formatDate(comment.created_at) }}</p>
      </li>
    </ul>
  </div>
</template>
