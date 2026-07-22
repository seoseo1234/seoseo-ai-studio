import React from 'react';
import { GripVertical, Link2Off, Pencil, Pin, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { LinkStatus, WebApp } from '../../lib/portal-types';
import { usePortalStore } from '../../store/usePortalStore';
import styles from './AppCard.module.css';

interface AppCardProps {
  app: WebApp;
  linkStatus?: LinkStatus;
  onEdit: (app: WebApp) => void;
  onPin: (app: WebApp) => void;
  onDragStart: (app: WebApp) => void;
  onDrop: (app: WebApp) => void;
}

export const AppCard: React.FC<AppCardProps> = ({ app, linkStatus = 'unknown', onEdit, onPin, onDragStart, onDrop }) => {
  const { isAdmin } = usePortalStore();

  const stop = (event: React.MouseEvent, action: () => void) => {
    event.preventDefault();
    event.stopPropagation();
    action();
  };

  const handleDelete = async () => {
    if (!window.confirm(`'${app.title}' 앱을 삭제할까요? 변경 이력에서 복구할 수 있습니다.`)) return;
    const { error } = await supabase.from('apps').update({ deletedAt: new Date().toISOString() }).eq('id', app.id);
    if (error) {
      console.error('Error deleting app: ', error);
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const openApp = () => window.open(app.url, '_blank', 'noopener,noreferrer');

  return (
    <div
      role="link"
      tabIndex={0}
      className={styles.cardLink}
      draggable={isAdmin}
      onDragStart={() => onDragStart(app)}
      onDragOver={(event) => { if (isAdmin) event.preventDefault(); }}
      onDrop={(event) => { event.preventDefault(); onDrop(app); }}
      onClick={openApp}
      onKeyDown={(event) => { if (event.key === 'Enter') openApp(); }}
    >
      <div className={styles.card}>
        {isAdmin && <>
          <div className={styles.dragHandle} title="드래그하여 순서 변경"><GripVertical size={18} /></div>
          <div className={styles.adminActions}>
            <button className={`${styles.editButton} ${app.isPinned ? styles.pinnedButton : ''}`} onClick={(event) => stop(event, () => onPin(app))} aria-label={`${app.title} ${app.isPinned ? '고정 해제' : '상단 고정'}`} title={app.isPinned ? '고정 해제' : '상단 고정'}><Pin size={16} fill={app.isPinned ? 'currentColor' : 'none'} /></button>
            <button className={styles.editButton} onClick={(event) => stop(event, () => onEdit(app))} aria-label={`${app.title} 수정`}><Pencil size={16} /></button>
            <button className={styles.deleteButton} onClick={(event) => stop(event, () => { void handleDelete(); })} aria-label={`${app.title} 삭제`}><Trash2 size={16} /></button>
          </div>
        </>}
        {isAdmin && linkStatus === 'offline' && <div className={styles.offlineBadge}><Link2Off size={13} /> 연결 확인 필요</div>}
        <div className={styles.thumbnailContainer}>
          {app.thumbnailUrl ? <img src={app.thumbnailUrl} alt={app.title} className={styles.image} /> : <div className={styles.placeholderImage}><span>{app.title.charAt(0)}</span></div>}
        </div>
        <div className={styles.content}>
          <div className={styles.category}>{app.category}</div>
          <h3 className={styles.title}>{app.title}</h3>
        </div>
      </div>
    </div>
  );
};
