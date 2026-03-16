import { ref } from "vue";
import { getDb } from "./useDatabase";
import type { Task, TaskStatusDate, TaskComment } from "../types";

export function useTasks() {
  const tasks = ref<Task[]>([]);
  const taskStatusDates = ref<TaskStatusDate[]>([]);
  const comments = ref<TaskComment[]>([]);

  async function fetchTasks() {
    const db = await getDb();
    tasks.value = await db.select<Task[]>("SELECT * FROM tasks ORDER BY created_at DESC");
  }

  async function fetchInboxTasks() {
    const db = await getDb();
    tasks.value = await db.select<Task[]>(
      "SELECT * FROM tasks WHERE current_status_id IS NULL ORDER BY created_at DESC"
    );
  }

  async function fetchTasksByType(taskTypeId: number) {
    const db = await getDb();
    tasks.value = await db.select<Task[]>(
      "SELECT * FROM tasks WHERE task_type_id = $1 ORDER BY created_at DESC",
      [taskTypeId]
    );
  }

  async function fetchTaskById(taskId: number): Promise<Task | null> {
    const db = await getDb();
    const rows = await db.select<Task[]>(
      "SELECT * FROM tasks WHERE id = $1",
      [taskId]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  async function fetchTasksByStatus(statusId: number) {
    const db = await getDb();
    tasks.value = await db.select<Task[]>(
      "SELECT * FROM tasks WHERE current_status_id = $1 ORDER BY created_at DESC",
      [statusId]
    );
  }

  async function createTask(
    title: string,
    description: string | null,
    taskTypeId: number | null,
    currentStatusId: number | null
  ): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      "INSERT INTO tasks (title, description, task_type_id, current_status_id) VALUES ($1, $2, $3, $4)",
      [title, description, taskTypeId, currentStatusId]
    );
    return result.lastInsertId ?? 0;
  }

  async function updateTask(id: number, title: string, description: string | null) {
    const db = await getDb();
    await db.execute("UPDATE tasks SET title = $1, description = $2 WHERE id = $3", [title, description, id]);
  }

  async function deleteTask(id: number) {
    const db = await getDb();
    await db.execute("DELETE FROM tasks WHERE id = $1", [id]);
  }

  async function revertStatus(taskId: number, prevStatusId: number, currentStatusId: number) {
    const db = await getDb();
    // 現在のステータスの completed_at をクリア
    await db.execute(
      "UPDATE task_status_dates SET completed_at = NULL WHERE task_id = $1 AND status_id = $2",
      [taskId, currentStatusId]
    );
    // 戻り先ステータスの completed_at もクリア（再進行中扱い）
    await db.execute(
      "UPDATE task_status_dates SET completed_at = NULL WHERE task_id = $1 AND status_id = $2",
      [taskId, prevStatusId]
    );
    // current_status_id を前のステータスに戻す
    await db.execute("UPDATE tasks SET current_status_id = $1, is_complete = 0 WHERE id = $2", [prevStatusId, taskId]);
  }

  async function advanceStatus(taskId: number, nextStatusId: number, prevStatusId: number | null) {
    const db = await getDb();
    // 前のステータスに完了日を記録
    if (prevStatusId) {
      await db.execute(
        "UPDATE task_status_dates SET completed_at = DATE('now') WHERE task_id = $1 AND status_id = $2",
        [taskId, prevStatusId]
      );
    }
    // 現在のステータスを更新
    await db.execute("UPDATE tasks SET current_status_id = $1 WHERE id = $2", [nextStatusId, taskId]);

    // 最終ステータスなら自動的に completed_at をセット（= タスク完了）
    const hasNext = await db.select<{ cnt: number }[]>(
      `SELECT COUNT(*) AS cnt FROM statuses
       WHERE task_type_id = (SELECT task_type_id FROM statuses WHERE id = $1)
         AND position > (SELECT position FROM statuses WHERE id = $1)`,
      [nextStatusId]
    );
    if (hasNext[0]?.cnt === 0) {
      const existing = await db.select<{ id: number }[]>(
        "SELECT id FROM task_status_dates WHERE task_id = $1 AND status_id = $2",
        [taskId, nextStatusId]
      );
      if (existing.length > 0) {
        await db.execute(
          "UPDATE task_status_dates SET completed_at = DATE('now') WHERE task_id = $1 AND status_id = $2",
          [taskId, nextStatusId]
        );
      } else {
        await db.execute(
          "INSERT INTO task_status_dates (task_id, status_id, completed_at) VALUES ($1, $2, DATE('now'))",
          [taskId, nextStatusId]
        );
      }
    }
  }

  async function completeTask(taskId: number) {
    const db = await getDb();
    const task = await fetchTaskById(taskId);
    if (task?.current_status_id) {
      const existing = await db.select<{ id: number }[]>(
        "SELECT id FROM task_status_dates WHERE task_id = $1 AND status_id = $2",
        [taskId, task.current_status_id]
      );
      if (existing.length > 0) {
        await db.execute(
          "UPDATE task_status_dates SET completed_at = DATE('now') WHERE task_id = $1 AND status_id = $2",
          [taskId, task.current_status_id]
        );
      } else {
        await db.execute(
          "INSERT INTO task_status_dates (task_id, status_id, completed_at) VALUES ($1, $2, DATE('now'))",
          [taskId, task.current_status_id]
        );
      }
    }
    await db.execute("UPDATE tasks SET is_complete = 1 WHERE id = $1", [taskId]);
  }

  // TaskStatusDates
  async function fetchTaskStatusDates(taskId: number) {
    const db = await getDb();
    taskStatusDates.value = await db.select<TaskStatusDate[]>(
      "SELECT * FROM task_status_dates WHERE task_id = $1 ORDER BY id",
      [taskId]
    );
  }

  async function upsertTaskStatusDate(
    taskId: number,
    statusId: number,
    startedAt: string | null,
    dueDate: string | null,
    notes: string | null
  ) {
    const db = await getDb();
    const existing = await db.select<TaskStatusDate[]>(
      "SELECT id FROM task_status_dates WHERE task_id = $1 AND status_id = $2",
      [taskId, statusId]
    );
    if (existing.length > 0) {
      await db.execute(
        "UPDATE task_status_dates SET started_at = $1, due_date = $2, notes = $3 WHERE task_id = $4 AND status_id = $5",
        [startedAt, dueDate, notes, taskId, statusId]
      );
    } else {
      await db.execute(
        "INSERT INTO task_status_dates (task_id, status_id, started_at, due_date, notes) VALUES ($1, $2, $3, $4, $5)",
        [taskId, statusId, startedAt, dueDate, notes]
      );
    }
  }

  // Comments
  async function fetchComments(taskId: number) {
    const db = await getDb();
    comments.value = await db.select<TaskComment[]>(
      "SELECT * FROM task_comments WHERE task_id = $1 ORDER BY created_at DESC",
      [taskId]
    );
  }

  async function addComment(taskId: number, content: string) {
    const db = await getDb();
    await db.execute("INSERT INTO task_comments (task_id, content) VALUES ($1, $2)", [taskId, content]);
    await fetchComments(taskId);
  }

  async function deleteComment(commentId: number, taskId: number) {
    const db = await getDb();
    await db.execute("DELETE FROM task_comments WHERE id = $1", [commentId]);
    await fetchComments(taskId);
  }

  return {
    tasks,
    taskStatusDates,
    comments,
    fetchTasks,
    fetchInboxTasks,
    fetchTasksByType,
    fetchTaskById,
    fetchTasksByStatus,
    createTask,
    updateTask,
    deleteTask,
    revertStatus,
    advanceStatus,
    completeTask,
    fetchTaskStatusDates,
    upsertTaskStatusDate,
    fetchComments,
    addComment,
    deleteComment,
  };
}
