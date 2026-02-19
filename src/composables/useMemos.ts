import { ref } from "vue";
import { getDb } from "./useDatabase";
import type { Memo } from "../types";

export function useMemos() {
  const memos = ref<Memo[]>([]);

  async function fetchMemos(folderId: number | null = null) {
    const db = await getDb();
    if (folderId === null) {
      memos.value = await db.select<Memo[]>("SELECT * FROM memos ORDER BY updated_at DESC, created_at DESC");
    } else {
      memos.value = await db.select<Memo[]>(
        "SELECT * FROM memos WHERE folder_id = $1 ORDER BY updated_at DESC, created_at DESC",
        [folderId]
      );
    }
  }

  async function createMemo(title: string, content: string | null, folderId: number | null): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      "INSERT INTO memos (title, content, folder_id, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)",
      [title, content, folderId]
    );
    return result.lastInsertId ?? 0;
  }

  async function updateMemo(id: number, title: string, content: string | null) {
    const db = await getDb();
    await db.execute(
      "UPDATE memos SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3",
      [title, content, id]
    );
  }

  async function deleteMemo(id: number) {
    const db = await getDb();
    await db.execute("DELETE FROM memos WHERE id = $1", [id]);
  }

  async function moveMemo(id: number, folderId: number | null) {
    const db = await getDb();
    await db.execute("UPDATE memos SET folder_id = $1 WHERE id = $2", [folderId, id]);
  }

  return {
    memos,
    fetchMemos,
    createMemo,
    updateMemo,
    deleteMemo,
    moveMemo,
  };
}
