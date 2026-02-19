import { ref } from "vue";
import { getDb } from "./useDatabase";
import type { TodayTask } from "../types";

export function useTodayTasks() {
  const dueTodayTasks = ref<TodayTask[]>([]);
  const startingTodayTasks = ref<TodayTask[]>([]);
  const overdueTasks = ref<TodayTask[]>([]);
  const inProgressTasks = ref<TodayTask[]>([]);

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
       ORDER BY t.title`,
      [date]
    );
  }

  async function fetchStartingTodayTasks(date: string) {
    const db = await getDb();
    startingTodayTasks.value = await db.select<TodayTask[]>(
      `${BASE_QUERY}
       WHERE tsd.started_at = $1
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
         ${NEXT_STATUS_SUBQUERY} AS next_status_id
       FROM tasks t
       LEFT JOIN statuses s ON s.id = t.current_status_id
       LEFT JOIN task_types tt ON tt.id = t.task_type_id
       LEFT JOIN task_status_dates tsd ON tsd.task_id = t.id AND tsd.status_id = t.current_status_id
       WHERE t.current_status_id IS NOT NULL
         AND (tsd.started_at IS NULL OR tsd.started_at <= $1)
         AND (tsd.completed_at IS NULL)
       ORDER BY t.created_at DESC`,
      [date]
    );
  }

  async function fetchAll(date: string) {
    await Promise.all([
      fetchInProgressTasks(date),
      fetchDueTodayTasks(date),
      fetchStartingTodayTasks(date),
      fetchOverdueTasks(date),
    ]);
  }

  return {
    dueTodayTasks,
    startingTodayTasks,
    overdueTasks,
    inProgressTasks,
    fetchAll,
  };
}
