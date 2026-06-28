import React from 'react';
import Image from 'next/image';
import { ExternalLink, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { usePortalStore } from '../../store/usePortalStore';
import styles from './AppCard.module.css';

export interface WebApp {
  id: string;
  title: string;
  category: string;
  url: string;
  thumbnailUrl: string;
}

interface AppCardProps {
  app: WebApp;
}

export const AppCard: React.FC<AppCardProps> = ({ app }) => {
  const { isAdmin } = usePortalStore();

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault(); // Prevent opening the link
    e.stopPropagation();
    
    if (window.confirm(`'${app.title}' 앱을 정말 삭제하시겠습니까?`)) {
      try {
        const { error } = await supabase
          .from('apps')
          .delete()
          .eq('id', app.id);
          
        if (error) throw error;
      } catch (err) {
        console.error("Error deleting app: ", err);
        alert("삭제 중 오류가 발생했습니다.");
      }
    }
  };

  return (
    <a href={app.url} target="_blank" rel="noopener noreferrer" className={styles.cardLink}>
      <div className={styles.card}>
        {isAdmin && (
          <button 
            className={styles.deleteButton} 
            onClick={handleDelete}
            aria-label="Delete app"
          >
            <Trash2 size={16} />
          </button>
        )}
        <div className={styles.thumbnailContainer}>
        {app.thumbnailUrl ? (
          <img src={app.thumbnailUrl} alt={app.title} className={styles.image} />
        ) : (
          <div className={styles.placeholderImage}>
            <span>{app.title.charAt(0)}</span>
          </div>
        )}
      </div>
      <div className={styles.content}>
        <div className={styles.category}>{app.category}</div>
        <h3 className={styles.title}>{app.title}</h3>
      </div>
      </div>
    </a>
  );
};
