import React from 'react';
import { usePortalStore } from '../../store/usePortalStore';
import styles from './CategoryBar.module.css';

interface CategoryBarProps {
  categories: string[];
}

export const CategoryBar: React.FC<CategoryBarProps> = ({ categories }) => {
  const { selectedCategory, setSelectedCategory } = usePortalStore();

  const allCategories = ['All', ...categories];

  return (
    <div className={styles.categoryBarContainer}>
      <div className={styles.scrollArea}>
        {allCategories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`${styles.categoryTab} ${
              selectedCategory === category ? styles.active : ''
            }`}
          >
            {category}
          </button>
        ))}
      </div>
    </div>
  );
};
