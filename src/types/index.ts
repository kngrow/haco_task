// === Task Types ===

export interface TaskType {
  id: number;
  name: string;
}

export interface Status {
  id: number;
  task_type_id: number;
  name: string;
  position: number;
}

export interface Task {
  id: number;
  task_type_id: number | null;
  current_status_id: number | null;
  title: string;
  description: string | null;
  created_at: string;
  is_complete: number;
}

export interface TaskStatusDate {
  id: number;
  task_id: number;
  status_id: number;
  started_at: string | null;
  due_date: string | null;
  completed_at: string | null;
  notes: string | null;
}

export interface TaskComment {
  id: number;
  task_id: number;
  content: string;
  created_at: string;
}

// === Today View ===

export interface StatusHistory {
  status_id: number;
  status_name: string;
  position: number;
  started_at: string | null;
  due_date: string | null;
  completed_at: string | null;
}

export interface TodayTask {
  id: number;
  title: string;
  description: string | null;
  status_name: string | null;
  task_type_name: string | null;
  due_date: string | null;
  started_at: string | null;
  current_status_id: number | null;
  next_status_id: number | null;
  is_complete: number;
}

// === Memo Types ===

export interface Folder {
  id: number;
  name: string;
  parent_id: number | null;
}

export interface Memo {
  id: number;
  folder_id: number | null;
  title: string;
  content: string | null;
  created_at: string;
  updated_at: string | null;
}
