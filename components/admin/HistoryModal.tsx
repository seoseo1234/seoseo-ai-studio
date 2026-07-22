import React, { useEffect, useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AppHistory } from '../../lib/portal-types';
import { Button } from '../ui/Button';
import modalStyles from './AdminLoginModal.module.css';
import styles from './ManagementModal.module.css';

interface Props {
  onClose: () => void;
  onRestored: () => Promise<void>;
}

export function HistoryModal({ onClose, onRestored }: Props) {
  const [history, setHistory] = useState<AppHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    supabase.from('app_history').select('*').order('createdAt', { ascending: false }).limit(50).then(({ data, error: loadError }) => {
      if (!active) return;
      if (loadError) setError(loadError.message);
      else setHistory((data ?? []) as AppHistory[]);
      setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const restore = async (entry: AppHistory) => {
    if (!window.confirm(`'${entry.snapshot.title}' 앱을 이 시점의 상태로 복원할까요?`)) return;
    const { error: restoreError } = await supabase.rpc('restore_app_history', { history_id: entry.id });
    if (restoreError) return setError(restoreError.message);
    setHistory((current) => current.filter((item) => item.id !== entry.id));
    await onRestored();
  };

  return <div className={modalStyles.modalOverlay} onClick={onClose}>
    <div className={`${modalStyles.modalContent} ${styles.wideModal}`} onClick={(event) => event.stopPropagation()}>
      <div className={modalStyles.modalHeader}><h2>변경 이력 및 복구</h2></div>
      <div className={styles.body}>
        <p className={styles.description}>최근 50개의 수정·삭제 직전 상태입니다. 복원해도 현재 상태가 다시 이력에 남습니다.</p>
        {loading ? <div className={styles.empty}>이력을 불러오는 중...</div> : history.length === 0 ? <div className={styles.empty}>저장된 변경 이력이 없습니다.</div> : history.map((entry) => <div className={styles.historyRow} key={entry.id}>
          <div className={styles.historyInfo}>
            <p className={styles.historyTitle}>{entry.snapshot.title}</p>
            <p className={styles.historyMeta}>{entry.action === 'delete' ? '삭제 전 상태' : '수정 전 상태'} · {new Intl.DateTimeFormat('ko-KR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(entry.createdAt))}</p>
          </div>
          <Button variant="outlined" onClick={() => restore(entry)} icon={<RotateCcw size={15} />}>복원</Button>
        </div>)}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.footer}><Button variant="outlined" onClick={onClose}>닫기</Button></div>
      </div>
    </div>
  </div>;
}
