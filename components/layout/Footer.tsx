"use client";

import React, { useState } from 'react';
import { PolicyModal } from '../ui/PolicyModal';
import styles from './Footer.module.css';

export const Footer: React.FC = () => {
  const [modalType, setModalType] = useState<'terms' | 'privacy' | null>(null);

  return (
    <>
      <footer className={styles.footer}>
        <div className={styles.footerContent}>
          <div className={styles.links}>
            <button className={styles.linkButton} onClick={() => setModalType('terms')}>이용약관</button>
            <span className={styles.divider}>|</span>
            <button className={`${styles.linkButton} ${styles.bold}`} onClick={() => setModalType('privacy')}>개인정보처리방침</button>
          </div>
          <div className={styles.copyright}>
            © 2026 앱스퀘어(AppSquare). All rights reserved. | 정보관리책임자: 윤서희 교사 (서울잠동초등학교)
          </div>
        </div>
      </footer>

      <PolicyModal 
        isOpen={modalType !== null} 
        onClose={() => setModalType(null)} 
        type={modalType || 'terms'} 
      />
    </>
  );
};
