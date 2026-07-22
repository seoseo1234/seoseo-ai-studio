import React, { useState } from 'react';
import { ArrowDown, ArrowUp, Save, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { AppCategory } from '../../lib/portal-types';
import { Button } from '../ui/Button';
import modalStyles from './AdminLoginModal.module.css';
import styles from './ManagementModal.module.css';

interface Props {
  categories: AppCategory[];
  onClose: () => void;
  onChanged: () => Promise<void>;
}

export function CategoryManagerModal({ categories, onClose, onChanged }: Props) {
  const [items, setItems] = useState(categories);
  const [names, setNames] = useState<Record<string, string>>(() => Object.fromEntries(categories.map((item) => [item.name, item.name])));
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const rename = async (oldName: string) => {
    const nextName = names[oldName]?.trim();
    if (!nextName || nextName === oldName) return;
    setBusy(true); setError('');
    const { error: renameError } = await supabase.rpc('rename_app_category', { old_name: oldName, new_name: nextName });
    setBusy(false);
    if (renameError) return setError(renameError.message);
    setItems((current) => current.map((item) => item.name === oldName ? { ...item, name: nextName } : item));
    setNames((current) => ({ ...current, [nextName]: nextName }));
    await onChanged();
  };

  const move = async (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const reordered = [...items];
    [reordered[index], reordered[target]] = [reordered[target], reordered[index]];
    setItems(reordered);
    const { error: orderError } = await supabase.rpc('save_category_order', {
      items: reordered.map((item, position) => ({ name: item.name, position })),
    });
    if (orderError) { setError(orderError.message); setItems(items); return; }
    await onChanged();
  };

  const remove = async (name: string, replacement: string) => {
    const explanation = replacement ? `소속 앱은 '${replacement}' 카테고리로 이동합니다.` : '소속 앱이 있으면 삭제되지 않습니다.';
    if (!window.confirm(`'${name}' 카테고리를 삭제할까요? ${explanation}`)) return;
    setBusy(true); setError('');
    const { error: deleteError } = await supabase.rpc('delete_app_category', {
      category_name: name,
      replacement_name: replacement || null,
    });
    setBusy(false);
    if (deleteError) return setError(deleteError.message);
    setItems((current) => current.filter((item) => item.name !== name));
    await onChanged();
  };

  return <div className={modalStyles.modalOverlay} onClick={onClose}>
    <div className={`${modalStyles.modalContent} ${styles.wideModal}`} onClick={(event) => event.stopPropagation()}>
      <div className={modalStyles.modalHeader}><h2>카테고리 관리</h2></div>
      <div className={styles.body}>
        <p className={styles.description}>이름과 노출 순서를 바꿀 수 있습니다. 삭제할 때 소속 앱은 선택한 카테고리로 안전하게 이동합니다.</p>
        {items.map((item, index) => {
          const replacements = items.filter((candidate) => candidate.name !== item.name);
          return <div className={styles.row} key={item.id}>
            <input className={styles.input} value={names[item.name] ?? item.name} onChange={(event) => setNames((current) => ({ ...current, [item.name]: event.target.value }))} />
            <div className={styles.iconGroup}>
              <button className={styles.iconButton} onClick={() => rename(item.name)} aria-label={`${item.name} 이름 저장`} disabled={busy}><Save size={15} /></button>
              <button className={styles.iconButton} onClick={() => move(index, -1)} aria-label="위로" disabled={index === 0 || busy}><ArrowUp size={15} /></button>
              <button className={styles.iconButton} onClick={() => move(index, 1)} aria-label="아래로" disabled={index === items.length - 1 || busy}><ArrowDown size={15} /></button>
            </div>
            <select id={`replacement-${item.id}`} className={styles.select} defaultValue={replacements[0]?.name ?? ''} disabled={!replacements.length}>
              {replacements.map((candidate) => <option key={candidate.id} value={candidate.name}>{candidate.name}(으)로 이동</option>)}
            </select>
            <button className={`${styles.iconButton} ${styles.danger}`} onClick={() => {
              const select = document.getElementById(`replacement-${item.id}`) as HTMLSelectElement | null;
              void remove(item.name, select?.value ?? '');
            }} aria-label={`${item.name} 삭제`} disabled={busy}><Trash2 size={15} /></button>
          </div>;
        })}
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.footer}><Button variant="outlined" onClick={onClose}>닫기</Button></div>
      </div>
    </div>
  </div>;
}
