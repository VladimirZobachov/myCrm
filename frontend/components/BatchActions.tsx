'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import CommentModal from '@/components/CommentModal';
import ConfirmModal from '@/components/ConfirmModal';

const STATUSES = [
  { id: 1, label: 'ждет' },
  { id: 2, label: 'принят' },
  { id: 3, label: 'готов' },
];

/**
 * Плавающая панель групповых действий (появляется когда выбрано ≥1 заказа).
 * Статус / Архив / Комментарий / Удалить (только админ).
 */
export default function BatchActions({
  selectedIds,
  role,
  onDone,
}: {
  selectedIds: Set<number>;
  role: number;
  onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [error, setError] = useState('');

  const ids = Array.from(selectedIds);
  const count = ids.length;

  async function run(fn: () => Promise<unknown>) {
    setLoading(true);
    setError('');
    try {
      await fn();
      onDone();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  }

  async function setStatus(s: number) {
    await run(() => api.batchStatus(ids, s));
    setShowStatusMenu(false);
  }

  async function setArchived(v: boolean) {
    await run(() => api.batchArchive(ids, v));
  }

  async function addComment(comment: string) {
    await run(() => api.batchComment(ids, comment));
    setShowComment(false);
  }

  async function del() {
    await run(() => api.batchDelete(ids));
    setShowDelete(false);
  }

  if (count === 0) return null;

  const btnCls =
    'min-h-[44px] px-3 rounded-lg text-sm font-medium bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 disabled:opacity-50';

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[calc(100%-2rem)] max-w-lg">
      <div className="bg-slate-900 text-white rounded-2xl shadow-xl px-4 py-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-sm">Выбрано: {count}</span>

          <div className="relative">
            <button
              type="button"
              className={btnCls}
              disabled={loading}
              onClick={() => setShowStatusMenu((s) => !s)}
            >
              Статус ▾
            </button>
            {showStatusMenu && (
              <div className="absolute bottom-full mb-1 left-0 bg-white text-slate-800 rounded-xl shadow-lg border border-slate-200 overflow-hidden min-w-[140px]">
                {STATUSES.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    className="block w-full text-left px-4 py-2.5 text-sm hover:bg-slate-50"
                    onClick={() => setStatus(s.id)}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <button type="button" className={btnCls} disabled={loading} onClick={() => setArchived(true)}>
            В архив
          </button>
          <button type="button" className={btnCls} disabled={loading} onClick={() => setArchived(false)}>
            Из архива
          </button>
          <button type="button" className={btnCls} disabled={loading} onClick={() => setShowComment(true)}>
            Комментарий
          </button>
          {role === 1 && (
            <button
              type="button"
              className="min-h-[44px] px-3 rounded-lg text-sm font-medium bg-red-500 hover:bg-red-600 text-white disabled:opacity-50"
              disabled={loading}
              onClick={() => setShowDelete(true)}
            >
              Удалить
            </button>
          )}
          <button
            type="button"
            aria-label="Снять выделение"
            className="min-h-[44px] min-w-[44px] rounded-lg text-sm hover:bg-slate-700 text-slate-300"
            onClick={onDone}
            disabled={loading}
          >
            ×
          </button>
        </div>

        {error && <div className="text-sm text-red-300">{error}</div>}
      </div>

      {showComment && (
        <CommentModal
          role={role}
          initialComment=""
          onClose={() => setShowComment(false)}
          onApply={(comment) => addComment(comment)}
        />
      )}

      {showDelete && (
        <ConfirmModal
          title={`Удалить ${count} заказ(ов)?`}
          message="Внимание! После удаления все пропадет!"
          confirmLabel="Удалить"
          onConfirm={() => del()}
          onCancel={() => setShowDelete(false)}
        />
      )}
    </div>
  );
}
