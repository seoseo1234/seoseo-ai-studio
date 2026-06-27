"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { collection, getDocs, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Header } from '@/components/layout/Header';
import { CategoryBar } from '@/components/layout/CategoryBar';
import { AppCard, WebApp } from '@/components/ui/AppCard';
import { FloatingAdminButton } from '@/components/admin/FloatingAdminButton';
import { AdminLoginModal } from '@/components/admin/AdminLoginModal';
import { AppFormModal } from '@/components/admin/AppFormModal';
import { usePortalStore } from '@/store/usePortalStore';
import styles from './page.module.css';

export default function Home() {
  const { searchQuery, selectedCategory, isAdmin } = usePortalStore();
  const [apps, setApps] = useState<WebApp[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);

  useEffect(() => {
    // Real-time listener for apps
    const q = query(collection(db, 'apps'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedApps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as WebApp[];
      setApps(fetchedApps);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching apps: ", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = useMemo(() => {
    const cats = new Set(apps.map(app => app.category));
    return Array.from(cats);
  }, [apps]);

  const filteredApps = useMemo(() => {
    return apps.filter(app => {
      const matchesCategory = selectedCategory === 'All' || app.category === selectedCategory;
      const matchesSearch = app.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            app.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [apps, selectedCategory, searchQuery]);

  const handleAdminButtonClick = () => {
    if (isAdmin) {
      setIsFormModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <div className={styles.pageContainer}>
      <Header />
      <CategoryBar categories={categories} />
      
      <main className={styles.mainContent}>
        {loading ? (
          <div className={styles.emptyState}>
            <p>앱을 불러오는 중...</p>
          </div>
        ) : filteredApps.length > 0 ? (
          <div className={styles.gridContainer}>
            {filteredApps.map(app => (
              <AppCard key={app.id} app={app} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>등록된 웹앱이 없습니다.</p>
          </div>
        )}
      </main>

      <FloatingAdminButton onClick={handleAdminButtonClick} />

      <AdminLoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
      />

      {isAdmin && (
        <AppFormModal 
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          categories={categories}
        />
      )}
    </div>
  );
}
