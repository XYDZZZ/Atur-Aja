'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Menu, Search, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { TaskCard } from '@/components/dashboard/TaskCard';
import { SmartInput } from '@/components/dashboard/SmartInput';
import { FilterBar } from '@/components/dashboard/FilterBar';
import { TaskModal } from '@/components/dashboard/TaskModal';
import { HistoryPanel } from '@/components/dashboard/HistoryPanel';
import { CATEGORY_CONFIG } from '@/lib/utils';
import type { Task, TaskCategory, TaskStatus } from '@/types';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading, signOut } = useAuth();

  const [activeCategory, setActiveCategory] = useState<TaskCategory | 'semua'>('semua');
  const [showHistory,    setShowHistory]    = useState(false);
  const [isModalOpen,    setIsModalOpen]    = useState(false);
  const [editingTask,    setEditingTask]    = useState<Task | null>(null);
  const [theme,          setTheme]          = useState<'dark' | 'light'>('dark');
  const [sidebarOpen,    setSidebarOpen]    = useState(false);
  const [search,         setSearch]         = useState('');
  const [showSearch,     setShowSearch]     = useState(false);

  const { tasks, loading, filters, setFilters, createTask, updateTask, deleteTask } =
    useTasks(user?.id);

  // ── Theme ──────────────────────────────────────
  useEffect(() => {
    const saved = localStorage.getItem('aturaja-theme') as 'dark' | 'light' | null;
    if (saved) setTheme(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle('theme-light', theme === 'light');
    localStorage.setItem('aturaja-theme', theme);
  }, [theme]);

  // ── Auth guard ────────────────────────────────
  useEffect(() => {
    if (!authLoading && !user) router.replace('/login');
  }, [user, authLoading, router]);

  // ── Sync filters with local state ────────────
  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      category: activeCategory,
      search,
    }));
  }, [activeCategory, search, setFilters]);

  // ── Handlers ──────────────────────────────────
  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleNewTask = () => {
    setEditingTask(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus tugas ini secara permanen?')) return;
    await deleteTask(id);
  };

  const handleStatusChange = async (id: string, status: TaskStatus) => {
    await updateTask(id, { status });
  };

  const handleModalSave = async (data: Partial<Task>) => {
    if (editingTask) {
      await updateTask(editingTask.id, data);
    } else {
      await createTask(data as Parameters<typeof createTask>[0]);
    }
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const handleSignOut = async () => {
    await signOut();
    router.replace('/login');
  };

  // ── Page title ────────────────────────────────
  const pageTitle = showHistory
    ? 'Histori Tugas'
    : activeCategory === 'semua'
    ? 'Semua Tugas'
    : `${CATEGORY_CONFIG[activeCategory as TaskCategory].icon} ${CATEGORY_CONFIG[activeCategory as TaskCategory].label}`;

  // ── Loading splash ────────────────────────────
  if (authLoading || !user) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg-base)' }}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
            style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }}
          />
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Memuat AturAja…
          </p>
        </div>
      </div>
    );
  }

  const defaultCat: TaskCategory =
    activeCategory === 'semua' ? 'keseharian' : activeCategory;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      {/* ── Sidebar ── */}
      <Sidebar
        activeCategory={activeCategory}
        onCategoryChange={(cat) => {
          setActiveCategory(cat);
          setShowHistory(false);
        }}
        showHistory={showHistory}
        onToggleHistory={() => {
          setShowHistory((v) => !v);
          setActiveCategory('semua');
        }}
        userName={profile?.name ?? '—'}
        waNumber={profile?.wa_number ?? '—'}
        theme={theme}
        onToggleTheme={() => setTheme((t) => (t === 'dark' ? 'light' : 'dark'))}
        onSignOut={handleSignOut}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* ── Main ── */}
      <main className="lg:pl-[220px] min-h-screen flex flex-col">
        {/* Top bar */}
        <header
          className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b"
          style={{
            background: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Mobile menu */}
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-xl transition-all hover:bg-[var(--bg-hover)]"
            style={{ color: 'var(--text-secondary)' }}
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Title */}
          {!showSearch && (
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base truncate" style={{ color: 'var(--text-primary)' }}>
                {pageTitle}
              </h1>
              {!showHistory && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  {loading ? '…' : `${tasks.length} tugas`}
                </p>
              )}
            </div>
          )}

          {/* Inline search (mobile) */}
          {showSearch && !showHistory && (
            <div className="flex-1 relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                autoFocus
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tugas…"
                className="w-full pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)]"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>
          )}

          {/* Desktop search */}
          {!showHistory && (
            <div className="relative hidden sm:block">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'var(--text-muted)' }}
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari tugas…"
                className="pl-9 pr-4 py-2 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-[var(--accent-subtle)] focus:border-[var(--accent)] transition-all"
                style={{
                  background: 'var(--bg-card)',
                  borderColor: 'var(--border-default)',
                  color: 'var(--text-primary)',
                  width: '200px',
                }}
              />
            </div>
          )}

          {/* Mobile search toggle */}
          {!showHistory && (
            <button
              onClick={() => {
                setShowSearch((v) => !v);
                if (showSearch) setSearch('');
              }}
              className="sm:hidden p-2 rounded-xl transition-all hover:bg-[var(--bg-hover)]"
              style={{ color: 'var(--text-secondary)' }}
            >
              {showSearch ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
            </button>
          )}

          {/* Add task button */}
          {!showHistory && (
            <button
              onClick={handleNewTask}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold text-white transition-all shrink-0"
              style={{
                background: 'var(--accent)',
                boxShadow: '0 2px 14px var(--accent-glow)',
              }}
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Tambah</span>
            </button>
          )}
        </header>

        {/* Content */}
        <div className="flex-1 px-4 py-5">
          {showHistory ? (
            <HistoryPanel userId={user.id} />
          ) : (
            <div className="space-y-4 max-w-6xl">
              {/* Smart Input */}
              <SmartInput onTaskCreate={createTask} defaultCategory={defaultCat} />

              {/* Filter bar */}
              <FilterBar filters={filters} onFiltersChange={setFilters} />

              {/* Task grid */}
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="h-32 rounded-xl skeleton" />
                  ))}
                </div>
              ) : tasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="text-5xl mb-4">
                    {search ? '🔍' : '📭'}
                  </div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                    {search ? `Tidak ada tugas untuk "${search}"` : 'Belum ada tugas'}
                  </p>
                  <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                    {search
                      ? 'Coba kata kunci lain'
                      : 'Ketik di Smart Input di atas untuk mulai'}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {tasks.map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onEdit={handleEdit}
                      onDelete={handleDelete}
                      onStatusChange={handleStatusChange}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        task={editingTask}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTask(null);
        }}
        onSave={handleModalSave}
        defaultCategory={defaultCat}
      />
    </div>
  );
}
