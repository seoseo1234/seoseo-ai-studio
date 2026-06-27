import React, { useState } from 'react';
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
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });

      if (response.ok) {
        setIsAdmin(true);
        setCode('');
        onClose();
      } else {
        setError('관리자 코드가 일치하지 않습니다.');
      }
    } catch (err) {
      setError('서버 오류가 발생했습니다.');
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
