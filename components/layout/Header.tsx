import React, { useEffect } from 'react';
import Image from 'next/image';
import { Search, Moon, Sun } from 'lucide-react';
import { usePortalStore } from '../../store/usePortalStore';
import styles from './Header.module.css';

export const Header: React.FC = () => {
  const { searchQuery, setSearchQuery, theme, toggleTheme } = usePortalStore();

  // Initialize theme on mount
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, []);

  return (
    <header className={styles.header}>
      <div className={styles.logoContainer}>
        <Image src="/logo.png" alt="앱스퀘어 로고" width={48} height={48} className={styles.logoImage} />
        <h1 className={styles.title}>앱스퀘어</h1>
      </div>

      <div className={styles.searchContainer}>
        <Search className={styles.searchIcon} size={20} />
        <input 
          type="text" 
          placeholder="앱 및 태그 검색..." 
          className={styles.searchInput}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <button onClick={toggleTheme} className={styles.themeToggle} aria-label="Toggle Theme">
        {theme === 'light' ? <Moon size={24} /> : <Sun size={24} />}
      </button>
    </header>
  );
};
