'use client';

import { useState } from 'react';
import { Order, api } from '@/lib/api';

/**
 * Действия в строке заказа (ролевые, 1:1 с legacy):
 * - Админ (1): изменить статус, комментарий, архив, удалить
 * - Менеджер (2): изменить статус, комментарий (comment_manager)
 * - Монтажник (3): изменить статус (auto-assign), комментарий (comments)
 */
export default function RowActions({ order, role, onChanged }: { order: Order; role: number; onChanged: () => void }) {
  const [showStatus, setShowStatus] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);

  async function changeStatus(s: number) {
    setBusy(true);
    try {
      await api.updateStatus(order.id, s);
      setShowStatus(false);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function saveComment() {
    if (!comment.trim()) return;
    setBusy(true);
    try {
      await api.updateComment(order.id, comment);
      setShowComment(false);
      setComment('');
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function toggleArchive() {
    setBusy(true);
    try {
      await api.archive(order.id, !order.is_archived);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative flex items-center gap-2">
      {/* Сменить статус */}
      <button
        onClick={() => setShowStatus(!showStatus)}
        disabled={busy}
        className="text-xs text-indigo-600 hover:text-indigo-800 min-h-[36px] px-2 rounded hover:bg-indigo-50"
      >
        Статус
      </button>

      {/* Комментарий */}
      <button
        onClick={() => setShowComment(!showComment)}
        disabled={busy}
        className="text-xs text-indigo-600 hover:text-indigo-800 min-h-[36px] px-2 rounded hover:bg-indigo-50"
      >
        Комм.
      </button>

      {/* Архив — только админ */}
      {role === 1 && (
        <button
          onClick={toggleArchive}
          disabled={busy}
          className="text-xs text-slate-500 hover:text-slate-700 min-h-[36px] px-2 rounded hover:bg-slate-50"
        >
          {order.is_archived ? 'Разарх.' : 'Архив'}
        </button>
      )}

      {/* Попап статуса */}
      {showStatus && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-2 w-40">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => changeStatus(s)}
              disabled={busy}
              className="block w-full text-left px-3 py-2 text-sm rounded hover:bg-slate-50 min-h-[36px]"
            >
              {s === 1 && '⏳ В ожидании'}
              {s === 2 && '📋 Принят'}
              {s === 3 && '✅ Выполнено'}
            </button>
          ))}
        </div>
      )}

      {/* Попап комментария */}
      {showComment && (
        <div className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg p-3 w-64 space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Текст комментария..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={saveComment}
            disabled={busy || !comment.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg py-2 min-h-[36px] disabled:opacity-50"
          >
            Сохранить
          </button>
        </div>
      )}
    </div>
  );
}
