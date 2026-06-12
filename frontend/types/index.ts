// ─────────────────────────────────────────────────
//  AturAja — Global Types
// ─────────────────────────────────────────────────

export type TaskStatus =
  | 'akan_dilakukan'
  | 'proses'
  | 'jeda'
  | 'tertunda'
  | 'selesai';

export type TaskPriority = 'tinggi' | 'sedang' | 'rendah';
export type TaskCategory = 'keseharian' | 'tugas' | 'wishlist';

export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: TaskCategory;
  status: TaskStatus;
  priority: TaskPriority;
  deadline: string | null;
  alarm_time: string | null;
  alarm_sent: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  name: string;
  wa_number: string;
  created_at: string;
}

export interface ParsedTaskInput {
  title: string;
  deadline: Date | null;
  alarm_time: Date | null;
  category: TaskCategory | null;
  priority: TaskPriority | null;
}

// ── Filter / Sort types ────────────────────────────
export type FilterStatus   = TaskStatus | 'semua';
export type FilterPriority = TaskPriority | 'semua';
export type FilterCategory = TaskCategory | 'semua';
export type SortOption     = 'created_at' | 'deadline' | 'updated_at';
export type SortOrder      = 'asc' | 'desc';

export interface TaskFilters {
  status:    FilterStatus;
  priority:  FilterPriority;
  category:  FilterCategory;
  sortBy:    SortOption;
  sortOrder: SortOrder;
  search:    string;
}
