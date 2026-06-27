import React, { useState, useRef } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { Button } from '../ui/Button';
import styles from './AdminLoginModal.module.css'; // Reusing modal styles
import formStyles from './AppFormModal.module.css';

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
}

export const AppFormModal: React.FC<AppFormModalProps> = ({ isOpen, onClose, categories }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [url, setUrl] = useState('');
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImageFile(e.target.files[0]);
      setThumbnailUrl(''); // Clear URL if file is selected
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');

    try {
      const finalCategory = category === 'new' ? newCategory : category;
      if (!title || !finalCategory || !url) {
        throw new Error('필수 항목을 모두 입력해주세요.');
      }

      let finalThumbnailUrl = thumbnailUrl;

      // Upload image if file is selected
      if (imageFile) {
        const fileRef = ref(storage, `thumbnails/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(fileRef, imageFile);
        finalThumbnailUrl = await getDownloadURL(snapshot.ref);
      }

      // Save to Firestore
      await addDoc(collection(db, 'apps'), {
        title,
        category: finalCategory,
        url,
        thumbnailUrl: finalThumbnailUrl,
        createdAt: new Date()
      });

      // Reset and close
      setTitle('');
      setCategory('');
      setNewCategory('');
      setUrl('');
      setThumbnailUrl('');
      setImageFile(null);
      onClose();
      
      // Optionally trigger a re-fetch in the parent component, 
      // but Firestore real-time listener is better.
      window.location.reload(); 
    } catch (err: any) {
      console.error(err);
      setError(err.message || '저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${formStyles.largeModal}`} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>새로운 웹앱 등록</h2>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          {/* Title */}
          <div className={`${styles.inputGroup} ${title ? styles.hasValue : ''}`}>
            <label className={styles.floatingLabel}>앱 제목 (필수)</label>
            <input
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder=" "
              disabled={isUploading}
            />
          </div>

          {/* Category */}
          <div className={`${styles.inputGroup} ${category ? styles.hasValue : ''}`}>
            <label className={styles.floatingLabel}>카테고리 (필수)</label>
            <select
              className={styles.input}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={isUploading}
            >
              <option value="" disabled></option>
              {categories.filter(c => c !== 'All').map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
              <option value="new">+ 새 카테고리 추가</option>
            </select>
          </div>

          {category === 'new' && (
            <div className={`${styles.inputGroup} ${newCategory ? styles.hasValue : ''}`}>
              <label className={styles.floatingLabel}>새 카테고리 이름</label>
              <input
                type="text"
                className={styles.input}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder=" "
                disabled={isUploading}
              />
            </div>
          )}

          {/* URL */}
          <div className={`${styles.inputGroup} ${url ? styles.hasValue : ''}`}>
            <label className={styles.floatingLabel}>실행 링크 URL (필수)</label>
            <input
              type="url"
              className={styles.input}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder=" "
              disabled={isUploading}
            />
          </div>

          {/* Thumbnail */}
          <div className={formStyles.thumbnailSection}>
            <p className={formStyles.sectionLabel}>썸네일 사진</p>
            <div className={formStyles.uploadControls}>
              <div className={`${styles.inputGroup} ${thumbnailUrl ? styles.hasValue : ''}`} style={{ flex: 1 }}>
                <label className={styles.floatingLabel}>이미지 URL 입력</label>
                <input
                  type="url"
                  className={styles.input}
                  value={thumbnailUrl}
                  onChange={(e) => {
                    setThumbnailUrl(e.target.value);
                    setImageFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = '';
                  }}
                  placeholder=" "
                  disabled={isUploading}
                />
              </div>
              <span className={formStyles.or}>또는</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                ref={fileInputRef}
                className={formStyles.fileInput}
                disabled={isUploading}
              />
            </div>
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.modalActions}>
            <Button type="button" variant="outlined" onClick={onClose} disabled={isUploading}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={isUploading}>
              {isUploading ? '등록 중...' : '등록하기'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
