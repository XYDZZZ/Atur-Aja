'use client';

import { useEffect, useState, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Task, TaskFilters } from '@/types';

const DEFAULT_FILTERS: TaskFilters = {
  status:    'semua',
  priority:  'semua',
  category:  'semua',
  sortBy:    'created_at',
  sortOrder: 'desc',
  search:    '',
};

type CreatePayload = Omit<Task, 'id' | 'user_id' | 'created_at' | 'updated_at' | 'alarm_sent'>;

export function useTasks(userId: string | undefined) {
  const [tasks,   setTasks]   = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<TaskFilters>(DEFAULT_FILTERS);

  const supabase = createClient();

  const fetchTasks = useCallback(async () => {
    if (!userId) { setLoading(false); return; }
    setLoading(true);

    let q = supabase.from('tasks').select('*').eq('user_id', userId);

    if (filters.status   !== 'semua') q = q.eq('status',   filters.status);
    if (filters.priority !== 'semua') q = q.eq('priority', filters.priority);
    if (filters.category !== 'semua') q = q.eq('category', filters.category);
    if (filters.search)               q = q.ilike('title', `%${filters.search}%`);

    q = q.order(filters.sortBy, { ascending: filters.sortOrder === 'asc' });
    // secondary sort by created_at for stability
    if (filters.sortBy !== 'created_at') {
      q = q.order('created_at', { ascending: false });
    }

    const { data, error } = await q;
    if (!error && data) setTasks(data as Task[]);
    setLoading(false);
  }, [userId, filters, supabase]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  // ── Realtime subscription ──────────────────────
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`tasks-${userId}`)
      .on(
        'postgres_changes',
        {
          event:  '*',
          schema: 'public',
          table:  'tasks',
          filter: `user_id=eq.${userId}`,
        },
        () => fetchTasks()
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId, supabase, fetchTasks]);

  // ── CRUD ───────────────────────────────────────
  const createTask = async (payload: CreatePayload): Promise<boolean> => {
    if (!userId) return false;
    const { error } = await supabase
      .from('tasks')
      .insert({ ...payload, user_id: userId, alarm_sent: false });
    if (!error) await fetchTasks();
    return !error;
  };

  const updateTask = async (id: string, updates: Partial<Task>): Promise<boolean> => {
    const { error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id);
    if (!error) await fetchTasks();
    return !error;
  };

  const deleteTask = async (id: string): Promise<boolean> => {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);
    if (!error) await fetchTasks();
    return !error;
  };

  return {
    tasks,
    loading,
    filters,
    setFilters,
    createTask,
    updateTask,
    deleteTask,
    refresh: fetchTasks,
  };
}
