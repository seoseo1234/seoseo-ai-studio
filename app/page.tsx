"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FolderCog, History, Plus } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { AppCategory, LinkStatus, WebApp } from '@/lib/portal-types';
import { Header } from '@/components/layout/Header';
import { CategoryBar } from '@/components/layout/CategoryBar';
import { Footer } from '@/components/layout/Footer';
import { AppCard } from '@/components/ui/AppCard';
import { Button } from '@/components/ui/Button';
import { FloatingAdminButton } from '@/components/admin/FloatingAdminButton';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AppFormModal } from '@/components/admin/AppFormModal';
import { CategoryManagerModal } from '@/components/admin/CategoryManagerModal';
import { HistoryModal } from '@/components/admin/HistoryModal';
import { usePortalStore } from '@/store/usePortalStore';
import styles from './page.module.css';

export default function Home() {
  const { searchQuery, selectedCategory, setSelectedCategory, isAdmin } = usePortalStore();
  const [apps, setApps] = useState<WebApp[]>([]);
  const [categories, setCategories] = useState<AppCategory[]>([]);
  const [linkStatuses, setLinkStatuses] = useState<Record<string, LinkStatus>>({});
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState<WebApp | null>(null);

  const fetchData = useCallback(async () => {
    const [appsResult, categoriesResult] = await Promise.all([
      supabase.from('apps').select('*').is('deletedAt', null).order('isPinned', { ascending: false }).order('sortOrder', { ascending: true }),
      supabase.from('app_categories').select('*').order('sortOrder', { ascending: true }),
    ]);
    if (appsResult.error) console.error('Error fetching apps:', appsResult.error);
    else setApps(appsResult.data as WebApp[]);
    if (categoriesResult.error) console.error('Error fetching categories:', categoriesResult.error);
    else setCategories(categoriesResult.data as AppCategory[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const initialLoad = window.setTimeout(() => { void fetchData(); }, 0);
    let refreshTimer: number | undefined;
    const scheduleFetch = () => {
      window.clearTimeout(refreshTimer);
      refreshTimer = window.setTimeout(() => { void fetchData(); }, 250);
    };
    const channel = supabase.channel('portal-db-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'apps' }, scheduleFetch)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'app_categories' }, scheduleFetch)
      .subscribe();
    return () => {
      window.clearTimeout(initialLoad);
      window.clearTimeout(refreshTimer);
      void supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const orderedApps = useMemo(() => [...apps].sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || a.sortOrder - b.sortOrder), [apps]);
  const filteredApps = useMemo(() => orderedApps.filter((app) => {
    const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
    const query = searchQuery.toLowerCase();
    return matchesCategory && (app.title.toLowerCase().includes(query) || app.category.toLowerCase().includes(query));
  }), [orderedApps, selectedCategory, searchQuery]);

  useEffect(() => {
    if (!isAdmin || apps.length === 0) return;
    let active = true;
    const checkAllLinks = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !active) return;
      setLinkStatuses(Object.fromEntries(apps.map((app) => [app.id, 'checking' as const])));
      const results = await Promise.all(apps.map(async (app) => {
        try {
          const response = await fetch('/api/check-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ url: app.url }),
          });
          const data = await response.json() as { reachable?: boolean };
          return [app.id, data.reachable ? 'online' : 'offline'] as const;
        } catch {
          return [app.id, 'offline'] as const;
        }
      }));
      if (active) setLinkStatuses(Object.fromEntries(results));
    };
    void checkAllLinks();
    return () => { active = false; };
  }, [isAdmin, apps]);

  const openCreateForm = () => { setEditingApp(null); setIsFormModalOpen(true); };
  const closeForm = () => { setIsFormModalOpen(false); setEditingApp(null); };

  const togglePin = async (app: WebApp) => {
    setApps((current) => current.map((item) => item.id === app.id ? { ...item, isPinned: !item.isPinned } : item));
    const { error } = await supabase.from('apps').update({ isPinned: !app.isPinned }).eq('id', app.id);
    if (error) { console.error(error); await fetchData(); }
  };

  const dropApp = async (target: WebApp) => {
    const source = orderedApps.find((app) => app.id === draggedId);
    setDraggedId(null);
    if (!source || source.id === target.id || source.isPinned !== target.isPinned) return;
    const reordered = [...orderedApps];
    const from = reordered.findIndex((app) => app.id === source.id);
    const to = reordered.findIndex((app) => app.id === target.id);
    reordered.splice(to, 0, reordered.splice(from, 1)[0]);
    const normalized = reordered.map((app, position) => ({ ...app, sortOrder: position }));
    setApps(normalized);
    const { error } = await supabase.rpc('save_app_order', { items: normalized.map((app, position) => ({ id: app.id, position })) });
    if (error) { console.error(error); await fetchData(); }
  };

  const refreshCategories = async () => {
    setSelectedCategory('All');
    await fetchData();
  };

  return <div className={styles.pageContainer}>
    <Header />
    <CategoryBar categories={categories.map((category) => category.name)} />
    <main className={styles.mainContent}>
      {isAdmin && <div className={styles.adminToolbar}>
        <div><strong>관리자 도구</strong><span> 카드를 드래그해 순서를 바꿀 수 있습니다.</span></div>
        <div className={styles.toolbarActions}>
          <Button onClick={openCreateForm} icon={<Plus size={16} />}>앱 등록</Button>
          <Button variant="outlined" onClick={() => setIsCategoryModalOpen(true)} icon={<FolderCog size={16} />}>카테고리</Button>
          <Button variant="outlined" onClick={() => setIsHistoryModalOpen(true)} icon={<History size={16} />}>변경 이력</Button>
        </div>
      </div>}

      {loading ? <div className={styles.emptyState}><p>앱을 불러오는 중...</p></div> : filteredApps.length ? <div className={styles.gridContainer}>
        {filteredApps.map((app) => <AppCard key={app.id} app={app} linkStatus={linkStatuses[app.id]} onEdit={(selected) => { setEditingApp(selected); setIsFormModalOpen(true); }} onPin={togglePin} onDragStart={(selected) => setDraggedId(selected.id)} onDrop={dropApp} />)}
      </div> : <div className={styles.emptyState}><p>등록된 앱이 없습니다.</p></div>}
    </main>

    <FloatingAdminButton onClick={() => isAdmin ? openCreateForm() : setIsLoginModalOpen(true)} />
    <AdminLoginModal isOpen={isLoginModalOpen} onClose={() => setIsLoginModalOpen(false)} />
    {isAdmin && isFormModalOpen && <AppFormModal isOpen onClose={closeForm} categories={categories.map((category) => category.name)} editingApp={editingApp} />}
    {isAdmin && isCategoryModalOpen && <CategoryManagerModal categories={categories} onClose={() => setIsCategoryModalOpen(false)} onChanged={refreshCategories} />}
    {isAdmin && isHistoryModalOpen && <HistoryModal onClose={() => setIsHistoryModalOpen(false)} onRestored={fetchData} />}
    <Footer />
  </div>;
}
