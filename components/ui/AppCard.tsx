import React from 'react';
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
  return (
    <a 
      href={app.url} 
      target="_blank" 
      rel="noopener noreferrer" 
      className={styles.card}
    >
      <div className={styles.imageContainer}>
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
    </a>
  );
};
