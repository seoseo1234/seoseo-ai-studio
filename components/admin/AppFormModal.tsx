import React, { useEffect, useRef, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { WebApp } from '../../lib/portal-types';
import { Button } from '../ui/Button';
import styles from './AdminLoginModal.module.css';
import formStyles from './AppFormModal.module.css';

interface AppFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: string[];
  editingApp?: WebApp | null;
}

function validWebUrl(value: string) {
  try {
    const parsed = new URL(value);
    return ['http:', 'https:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

function faviconUrl(value: string) {
  const domain = new URL(value).hostname;
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
}

export const AppFormModal: React.FC<AppFormModalProps> = ({ isOpen, onClose, categories, editingApp = null }) => {
  const [title, setTitle] = useState(editingApp?.title ?? '');
  const [category, setCategory] = useState(editingApp?.category ?? '');
  const [newCategory, setNewCategory] = useState('');
  const [url, setUrl] = useState(editingApp?.url ?? '');
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState(editingApp?.thumbnailUrl ?? '');
  const [useDefaultFavicon, setUseDefaultFavicon] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [linkState, setLinkState] = useState<'idle' | 'checking' | 'online' | 'offline'>('idle');
  const [linkMessage, setLinkMessage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => () => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
  }, []);

  if (!isOpen) return null;

  const handleFileChange = (file: File | null) => {
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = file ? URL.createObjectURL(file) : null;
    setThumbnailFile(file);
    setPreviewUrl(objectUrlRef.current ?? editingApp?.thumbnailUrl ?? '');
    setUseDefaultFavicon(false);
  };

  const resetToFavicon = () => {
    if (!validWebUrl(url)) {
      setError('기본 파비콘을 만들려면 올바른 링크를 먼저 입력해주세요.');
      return;
    }
    if (objectUrlRef.current) URL.revokeObjectURL(objectUrlRef.current);
    objectUrlRef.current = null;
    setThumbnailFile(null);
    setPreviewUrl(faviconUrl(url));
    setUseDefaultFavicon(true);
    setFileInputKey((value) => value + 1);
    setError('');
  };

  const checkLink = async () => {
    if (!validWebUrl(url)) {
      setLinkState('offline');
      setLinkMessage('올바른 http(s) 주소를 입력해주세요.');
      return false;
    }

    setLinkState('checking');
    setLinkMessage('연결 확인 중...');
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setLinkState('offline');
      setLinkMessage('로그인 세션을 확인해주세요.');
      return false;
    }

    try {
      const response = await fetch('/api/check-url', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ url }),
      });
      const result = await response.json() as { reachable?: boolean; status?: number; reason?: string };
      setLinkState(result.reachable ? 'online' : 'offline');
      setLinkMessage(result.reachable ? `연결 가능${result.status ? ` (${result.status})` : ''}` : (result.reason ?? '연결할 수 없습니다.'));
      return Boolean(result.reachable);
    } catch {
      setLinkState('offline');
      setLinkMessage('링크 확인 중 오류가 발생했습니다.');
      return false;
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsUploading(true);
    setError('');

    try {
      const finalCategory = editingApp?.category ?? (category === 'new' ? newCategory.trim() : category);
      if (!title.trim() || !finalCategory || !url.trim()) throw new Error('필수 항목을 모두 입력해주세요.');
      if (!validWebUrl(url)) throw new Error('링크는 http:// 또는 https://로 시작하는 올바른 주소여야 합니다.');
      if (!editingApp && category === 'new' && categories.some((item) => item.toLowerCase() === finalCategory.toLowerCase())) {
        throw new Error('이미 존재하는 카테고리입니다. 목록에서 선택해주세요.');
      }
      if (thumbnailFile && thumbnailFile.size > 50 * 1024 * 1024) throw new Error('이미지는 50MB 이하만 업로드할 수 있습니다.');

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('로그인 세션이 만료되었습니다. 다시 로그인 해주세요.');

      let finalThumbnailUrl = editingApp?.thumbnailUrl ?? faviconUrl(url);
      if (useDefaultFavicon) finalThumbnailUrl = faviconUrl(url);

      if (thumbnailFile) {
        const fileExt = thumbnailFile.name.split('.').pop();
        const filePath = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage.from('thumbnails').upload(filePath, thumbnailFile);
        if (uploadError) throw new Error('썸네일 업로드에 실패했습니다: ' + uploadError.message);
        finalThumbnailUrl = supabase.storage.from('thumbnails').getPublicUrl(filePath).data.publicUrl;
      }

      const appValues = {
        title: title.trim(),
        category: finalCategory,
        url: url.trim(),
        thumbnailUrl: finalThumbnailUrl,
      };

      let saveError;
      if (editingApp) {
        ({ error: saveError } = await supabase.from('apps').update(appValues).eq('id', editingApp.id));
      } else {
        const { data: lastApp } = await supabase.from('apps').select('sortOrder').order('sortOrder', { ascending: false }).limit(1).maybeSingle();
        ({ error: saveError } = await supabase.from('apps').insert([{ ...appValues, sortOrder: (lastApp?.sortOrder ?? -1) + 1 }]));
        if (!saveError && category === 'new') {
          const { error: categoryError } = await supabase.from('app_categories').insert([{ name: finalCategory, sortOrder: categories.length }]);
          if (categoryError) throw categoryError;
        }
      }

      if (saveError) throw new Error(`${editingApp ? '앱 수정' : '앱 등록'}에 실패했습니다: ${saveError.message}`);
      onClose();
    } catch (caught: unknown) {
      console.error(caught);
      setError(caught instanceof Error ? caught.message : '저장 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={`${styles.modalContent} ${formStyles.largeModal}`} onClick={(event) => event.stopPropagation()}>
        <div className={styles.modalHeader}><h2>{editingApp ? '앱 수정' : '새로운 웹앱 등록'}</h2></div>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={`${styles.inputGroup} ${title ? styles.hasValue : ''}`}>
            <label className={styles.floatingLabel}>앱 제목 (필수)</label>
            <input type="text" className={styles.input} value={title} onChange={(event) => setTitle(event.target.value)} placeholder=" " disabled={isUploading} />
          </div>

          {!editingApp && <div className={`${styles.inputGroup} ${category ? styles.hasValue : ''}`}>
            <label className={styles.floatingLabel}>카테고리 (필수)</label>
            <select className={styles.input} value={category} onChange={(event) => setCategory(event.target.value)} disabled={isUploading}>
              <option value="" disabled></option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
              <option value="new">+ 새 카테고리 추가</option>
            </select>
          </div>}

          {!editingApp && category === 'new' && <div className={`${styles.inputGroup} ${newCategory ? styles.hasValue : ''}`}>
            <label className={styles.floatingLabel}>새 카테고리 이름</label>
            <input type="text" className={styles.input} value={newCategory} onChange={(event) => setNewCategory(event.target.value)} placeholder=" " disabled={isUploading} />
          </div>}

          <div>
            <div className={`${styles.inputGroup} ${url ? styles.hasValue : ''}`}>
              <label className={styles.floatingLabel}>실행 링크 URL (필수)</label>
              <input type="url" className={styles.input} value={url} onChange={(event) => { setUrl(event.target.value); setLinkState('idle'); }} onBlur={checkLink} placeholder=" " disabled={isUploading} />
            </div>
            {linkState !== 'idle' && <p className={`${formStyles.linkStatus} ${linkState === 'online' ? formStyles.success : linkState === 'offline' ? formStyles.failure : ''}`}>{linkMessage}</p>}
          </div>

          <div className={formStyles.thumbnailSection}>
            <label className={formStyles.fileLabel}>썸네일 이미지</label>
            <div className={formStyles.previewFrame}>
              {previewUrl ? <img src={previewUrl} alt="썸네일 미리보기" className={formStyles.previewImage} /> : <span>이미지를 선택하면 여기에 표시됩니다.</span>}
            </div>
            <input key={fileInputKey} type="file" accept="image/*" className={formStyles.fileInput} onChange={(event) => handleFileChange(event.target.files?.[0] ?? null)} disabled={isUploading} />
            <button type="button" className={formStyles.resetButton} onClick={resetToFavicon} disabled={isUploading}>
              <RotateCcw size={15} /> 기본 파비콘으로 되돌리기
            </button>
          </div>

          {error && <div className={styles.errorMessage}>{error}</div>}
          <div className={styles.modalActions}>
            <Button type="button" variant="outlined" onClick={onClose} disabled={isUploading}>취소</Button>
            <Button type="submit" variant="primary" disabled={isUploading}>{isUploading ? '저장 중...' : (editingApp ? '수정하기' : '등록하기')}</Button>
          </div>
        </form>
      </div>
    </div>
  );
};
