import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
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
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);
    setError('');

    try {
      const finalCategory = category === 'new' ? newCategory : category;
      if (!title || !finalCategory || !url) {
        throw new Error('필수 항목을 모두 입력해주세요.');
      }

      // Check session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('로그인 세션이 만료되었습니다. 다시 로그인 해주세요.');
      }

      let finalThumbnailUrl = '';

      if (thumbnailFile) {
        // Upload to Supabase Storage
        const fileExt = thumbnailFile.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('thumbnails')
          .upload(filePath, thumbnailFile);

        if (uploadError) {
          throw new Error('썸네일 업로드에 실패했습니다: ' + uploadError.message);
        }

        const { data: { publicUrl } } = supabase.storage
          .from('thumbnails')
          .getPublicUrl(filePath);
          
        finalThumbnailUrl = publicUrl;
      } else {
        // Generate Favicon URL automatically if no file provided
        try {
          const domain = new URL(url).hostname;
          finalThumbnailUrl = `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        } catch (err) {
          // Fallback
        }
      }

      // Save to Supabase
      const { error: insertError } = await supabase
        .from('apps')
        .insert([{
          title,
          category: finalCategory,
          url,
          thumbnailUrl: finalThumbnailUrl,
        }]);

      if (insertError) {
        throw new Error('앱 등록에 실패했습니다: ' + insertError.message);
      }

      // Reset and close
      setTitle('');
      setCategory('');
      setNewCategory('');
      setUrl('');
      setThumbnailFile(null);
      onClose();
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

          {/* Thumbnail Upload */}
          <div className={formStyles.thumbnailSection}>
            <label className={formStyles.fileLabel}>썸네일 이미지 (선택, 최대 50MB)</label>
            <input
              type="file"
              accept="image/*"
              className={formStyles.fileInput}
              onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
              disabled={isUploading}
            />
            <p className={formStyles.helperText}>선택하지 않으면 URL의 파비콘을 자동으로 가져옵니다.</p>
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
