import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/Button';
import { usePortalStore } from '../../store/usePortalStore';
import styles from './AdminLoginModal.module.css';

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setIsAdmin } = usePortalStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: 'admin@portal.com',
        password: code,
      });

      if (error) throw error;

      setIsAdmin(true);
      setCode('');
      onClose();
    } catch (err: any) {
      console.error('Login error:', err);
      setError('관리자 코드가 일치하지 않거나, 설정이 완료되지 않았습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>관리자 로그인</h2>
        </div>
        
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={`${styles.inputGroup} ${code ? styles.hasValue : ''} ${error ? styles.hasError : ''}`}>
            <label className={styles.floatingLabel}>관리자 코드</label>
            <input
              type="password"
              className={styles.input}
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder=" "
              disabled={isLoading}
            />
          </div>
          
          {error && <div className={styles.errorMessage}>{error}</div>}

          <div className={styles.modalActions}>
            <Button type="button" variant="outlined" onClick={onClose} disabled={isLoading}>
              취소
            </Button>
            <Button type="submit" variant="primary" disabled={isLoading || !code.trim()}>
              {isLoading ? '확인 중...' : '로그인'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
