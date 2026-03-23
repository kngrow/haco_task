import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;

export async function getDb(): Promise<Database> {
  if (!db) {
    db = await Database.load("sqlite:hako_task.db");
    await db.execute("PRAGMA foreign_keys = ON");
  }
  return db;
}
