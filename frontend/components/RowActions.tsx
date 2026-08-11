'use client';

import { useState } from 'react';
import { Order, api } from '@/lib/api';
import StatusModal from '@/components/StatusModal';
import CommentModal from '@/components/CommentModal';

/**
 * Действия в строке заказа (ролевые, 1:1 с legacy):
 * - Админ (1): изменить статус, комментарий (с выбором «кому»), архив
 * - Менеджер (2): изменить статус, комментарий (comment_manager)
 * - Монтажник (3): изменить статус (auto-assign), комментарий (comments)
 */
export default function RowActions({ order, role, onChanged }: { order: Order; role: number; onChanged: () => void }) {
  const [showStatus, setShowStatus] = useState(false);
  const [showComment, setShowComment] = useState(false);
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

  async function saveComment(comment: string, forUser?: number) {
    setBusy(true);
    try {
      await api.updateComment(order.id, comment, forUser);
      setShowComment(false);
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
        onClick={() => setShowStatus(true)}
        disabled={busy}
        className="text-xs text-indigo-600 hover:text-indigo-800 min-h-[36px] px-2 rounded hover:bg-indigo-50"
      >
        Статус
      </button>

      {/* Комментарий */}
      <button
        onClick={() => setShowComment(true)}
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

      {showStatus && (
        <StatusModal current={order.status} onClose={() => setShowStatus(false)} onApply={changeStatus} />
      )}

      {showComment && (
        <CommentModal role={role} onClose={() => setShowComment(false)} onApply={saveComment} />
      )}
    </div>
  );
}
