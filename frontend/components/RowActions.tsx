'use client';

import { useState } from 'react';
import { Order, api } from '@/lib/api';
import StatusModal from '@/components/StatusModal';
import CommentModal from '@/components/CommentModal';
import Modal from '@/components/Modal';

function MoreIcon() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="size-4">
      <circle cx="10" cy="4" r="1.6" fill="currentColor" />
      <circle cx="10" cy="10" r="1.6" fill="currentColor" />
      <circle cx="10" cy="16" r="1.6" fill="currentColor" />
    </svg>
  );
}

/**
 * Действия в строке заказа (ролевые, 1:1 с legacy), доступны через
 * кнопку-«три точки» → модалка со списком действий (см. Figma: More icon
 * в первой колонке таблицы, Group 1 / Ellipse 3-5):
 * - Админ (1): изменить статус, комментарий (с выбором «кому»), архив
 * - Менеджер (2): изменить статус, комментарий (comment_manager)
 * - Монтажник (3): изменить статус (auto-assign), комментарий (comments)
 */
export default function RowActions({ order, role, onChanged }: { order: Order; role: number; onChanged: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
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
    setShowMenu(false);
    setBusy(true);
    try {
      await api.archive(order.id, !order.is_archived);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(true)}
        disabled={busy}
        aria-label="Действия"
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors disabled:opacity-50"
      >
        <MoreIcon />
      </button>

      {showMenu && (
        <Modal onClose={() => setShowMenu(false)} maxWidth="sm:max-w-xs">
          <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
            <h2 className="text-lg font-semibold text-blue-600">Действия по заявке №{order.id}</h2>
          </div>
          <div className="px-4 py-3 flex flex-col">
            <button
              onClick={() => { setShowMenu(false); setShowStatus(true); }}
              className="min-h-[44px] rounded-lg px-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Сменить статус
            </button>
            <button
              onClick={() => { setShowMenu(false); setShowComment(true); }}
              className="min-h-[44px] rounded-lg px-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
            >
              Комментарий
            </button>
            {role === 1 && (
              <button
                onClick={toggleArchive}
                className="min-h-[44px] rounded-lg px-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
              >
                {order.is_archived ? 'Разархивировать' : 'Архив'}
              </button>
            )}
          </div>
          <div className="px-6 py-4 flex justify-end">
            <button
              onClick={() => setShowMenu(false)}
              className="min-h-[44px] rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Отмена
            </button>
          </div>
        </Modal>
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
