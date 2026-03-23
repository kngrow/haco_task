import { ref } from "vue";
import { getDb } from "./useDatabase";
import type { Folder } from "../types";

export function useFolders() {
  const folders = ref<Folder[]>([]);

  async function fetchFolders() {
    const db = await getDb();
    folders.value = await db.select<Folder[]>("SELECT * FROM folders ORDER BY name");
  }

  async function createFolder(name: string, parentId: number | null = null): Promise<number> {
    const db = await getDb();
    const result = await db.execute(
      "INSERT INTO folders (name, parent_id) VALUES ($1, $2)",
      [name, parentId]
    );
    await fetchFolders();
    return result.lastInsertId ?? 0;
  }

  async function updateFolder(id: number, name: string) {
    const db = await getDb();
    await db.execute("UPDATE folders SET name = $1 WHERE id = $2", [name, id]);
    await fetchFolders();
  }

  async function deleteFolder(id: number) {
    const db = await getDb();
    await db.execute("BEGIN TRANSACTION");
    try {
      // フォルダ内のメモをルートに移動
      await db.execute("UPDATE memos SET folder_id = NULL WHERE folder_id = $1", [id]);
      // 子フォルダの親をNULLに
      await db.execute("UPDATE folders SET parent_id = NULL WHERE parent_id = $1", [id]);
      await db.execute("DELETE FROM folders WHERE id = $1", [id]);
      await db.execute("COMMIT");
    } catch (e) {
      await db.execute("ROLLBACK");
      throw e;
    }
    await fetchFolders();
  }

  return {
    folders,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
  };
}
