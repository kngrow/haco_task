import { ref } from "vue";
import { getDb } from "./useDatabase";
import type { TaskType, Status } from "../types";

export function useTaskTypes() {
  const taskTypes = ref<TaskType[]>([]);
  const statuses = ref<Status[]>([]);

  async function fetchTaskTypes() {
    const db = await getDb();
    taskTypes.value = await db.select<TaskType[]>("SELECT * FROM task_types ORDER BY id");
  }

  async function fetchStatuses(taskTypeId: number) {
    const db = await getDb();
    statuses.value = await db.select<Status[]>(
      "SELECT * FROM statuses WHERE task_type_id = $1 ORDER BY position",
      [taskTypeId]
    );
  }

  async function createTaskType(name: string): Promise<number> {
    const db = await getDb();
    const result = await db.execute("INSERT INTO task_types (name) VALUES ($1)", [name]);
    await fetchTaskTypes();
    return result.lastInsertId ?? 0;
  }

  async function updateTaskType(id: number, name: string) {
    const db = await getDb();
    await db.execute("UPDATE task_types SET name = $1 WHERE id = $2", [name, id]);
    await fetchTaskTypes();
  }

  async function deleteTaskType(id: number) {
    const db = await getDb();
    await db.execute("DELETE FROM task_types WHERE id = $1", [id]);
    await fetchTaskTypes();
  }

  async function createStatus(taskTypeId: number, name: string, position: number): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      "INSERT INTO statuses (task_type_id, name, position) VALUES ($1, $2, $3)",
      [taskTypeId, name, position]
    );
    await fetchStatuses(taskTypeId);
    return result.lastInsertId ?? 0;
  }

  async function updateStatus(id: number, name: string, position: number) {
    const db = await getDb();
    await db.execute("UPDATE statuses SET name = $1, position = $2 WHERE id = $3", [name, position, id]);
  }

  async function deleteStatus(id: number) {
    const db = await getDb();
    // ステータス削除時、該当タスクをInboxに移動
    await db.execute("UPDATE tasks SET current_status_id = NULL WHERE current_status_id = $1", [id]);
    await db.execute("DELETE FROM statuses WHERE id = $1", [id]);
  }

  return {
    taskTypes,
    statuses,
    fetchTaskTypes,
    fetchStatuses,
    createTaskType,
    updateTaskType,
    deleteTaskType,
    createStatus,
    updateStatus,
    deleteStatus,
  };
}
