import { ref } from "vue";
import { getDb } from "./useDatabase";
import type { TodayTask, StatusHistory } from "../types";

export function useTodayTasks() {
  const dueTodayTasks = ref<TodayTask[]>([]);
  const startingTodayTasks = ref<TodayTask[]>([]);
  const overdueTasks = ref<TodayTask[]>([]);
  const inProgressTasks = ref<TodayTask[]>([]);
  const completedTasks = ref<TodayTask[]>([]);

  const NEXT_STATUS_SUBQUERY = `
    (SELECT s2.id FROM statuses s2
     WHERE s2.task_type_id = t.task_type_id
       AND s2.position > s.position
     ORDER BY s2.position ASC
     LIMIT 1)
  `;

  const BASE_QUERY = `
    SELECT
      t.id,
      t.title,
      t.description,
      s.name AS status_name,
      tt.name AS task_type_name,
      tsd.due_date,
      tsd.started_at,
      t.current_status_id,
      t.is_complete,
      ${NEXT_STATUS_SUBQUERY} AS next_status_id
    FROM task_status_dates tsd
    JOIN tasks t ON t.id = tsd.task_id
    LEFT JOIN statuses s ON s.id = t.current_status_id
    LEFT JOIN task_types tt ON tt.id = t.task_type_id
  `;

  async function fetchDueTodayTasks(date: string) {
    const db = await getDb();
    dueTodayTasks.value = await db.select<TodayTask[]>(
      `${BASE_QUERY}
       WHERE tsd.due_date = $1
         AND tsd.completed_at IS NULL
         AND t.is_complete = 0
       ORDER BY t.title`,
      [date]
    );
  }

  async function fetchStartingTodayTasks(date: string) {
    const db = await getDb();
    startingTodayTasks.value = await db.select<TodayTask[]>(
      `${BASE_QUERY}
       WHERE tsd.started_at = $1
         AND t.is_complete = 0
       ORDER BY t.title`,
      [date]
    );
  }

  async function fetchOverdueTasks(date: string) {
    const db = await getDb();
    overdueTasks.value = await db.select<TodayTask[]>(
      `${BASE_QUERY}
       WHERE tsd.due_date < $1
         AND tsd.completed_at IS NULL
         AND t.is_complete = 0
       ORDER BY tsd.due_date ASC`,
      [date]
    );
  }

  async function fetchInProgressTasks(date: string) {
    const db = await getDb();
    inProgressTasks.value = await db.select<TodayTask[]>(
      `SELECT
         t.id,
         t.title,
         t.description,
         s.name AS status_name,
         tt.name AS task_type_name,
         tsd.due_date,
         tsd.started_at,
         t.current_status_id,
         t.is_complete,
         ${NEXT_STATUS_SUBQUERY} AS next_status_id
       FROM tasks t
       LEFT JOIN statuses s ON s.id = t.current_status_id
       LEFT JOIN task_types tt ON tt.id = t.task_type_id
       LEFT JOIN task_status_dates tsd ON tsd.task_id = t.id AND tsd.status_id = t.current_status_id
       WHERE t.current_status_id IS NOT NULL
         AND t.is_complete = 0
         AND (tsd.started_at IS NULL OR tsd.started_at <= $1)
         AND (tsd.completed_at IS NULL)
       ORDER BY t.created_at DESC`,
      [date]
    );
  }

  async function fetchCompletedTasks(date: string) {
    const db = await getDb();
    completedTasks.value = await db.select<TodayTask[]>(
      `SELECT
         t.id,
         t.title,
         t.description,
         s.name AS status_name,
         tt.name AS task_type_name,
         (SELECT tsd2.due_date FROM task_status_dates tsd2 WHERE tsd2.task_id = t.id ORDER BY tsd2.id DESC LIMIT 1) AS due_date,
         (SELECT tsd2.started_at FROM task_status_dates tsd2 WHERE tsd2.task_id = t.id ORDER BY tsd2.id ASC LIMIT 1) AS started_at,
         t.current_status_id,
         t.is_complete,
         NULL AS next_status_id
       FROM tasks t
       LEFT JOIN statuses s ON s.id = t.current_status_id
       LEFT JOIN task_types tt ON tt.id = t.task_type_id
       WHERE t.is_complete = 1
         AND (
           SELECT MAX(tsd3.completed_at) FROM task_status_dates tsd3 WHERE tsd3.task_id = t.id
         ) <= $1
       ORDER BY (
         SELECT MAX(tsd4.completed_at) FROM task_status_dates tsd4 WHERE tsd4.task_id = t.id
       ) DESC`,
      [date]
    );
  }

  async function fetchAll(date: string) {
    await Promise.all([
      fetchInProgressTasks(date),
      fetchDueTodayTasks(date),
      fetchStartingTodayTasks(date),
      fetchOverdueTasks(date),
      fetchCompletedTasks(date),
    ]);
  }

  async function fetchTaskStatusHistory(taskId: number): Promise<StatusHistory[]> {
    const db = await getDb();
    return db.select<StatusHistory[]>(
      `SELECT
         s.id as status_id,
         s.name as status_name,
         s.position,
         tsd.started_at,
         tsd.due_date,
         tsd.completed_at
       FROM statuses s
       LEFT JOIN task_status_dates tsd ON tsd.status_id = s.id AND tsd.task_id = $1
       WHERE s.task_type_id = (SELECT task_type_id FROM tasks WHERE id = $1)
       ORDER BY s.position ASC`,
      [taskId]
    );
  }

  return {
    dueTodayTasks,
    startingTodayTasks,
    overdueTasks,
    inProgressTasks,
    completedTasks,
    fetchAll,
    fetchTaskStatusHistory,
  };
}
