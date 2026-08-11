'use client';

import { useState } from 'react';

/**
 * Модалка комментария (legacy updateComment):
 * - textarea для текста
 * - селект «кому» (for=1 админу, for=2 менеджеру) — только для админа
 */
export default function CommentModal({
  role,
  initialComment = '',
  onClose,
  onApply,
}: {
  role: number;
  initialComment?: string;
  onClose: () => void;
  onApply: (comment: string, forUser?: number) => void;
}) {
  const [comment, setComment] = useState(initialComment);
  const [forUser, setForUser] = useState(2); // по умолчанию менеджеру

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Комментарий</h2>

        <div className="space-y-1">
          <label htmlFor="comment-text" className="block text-sm font-medium text-slate-700">
            Комментарий *
          </label>
          <textarea
            id="comment-text"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
          />
        </div>

        {role === 1 && (
          <div className="space-y-1">
            <label htmlFor="comment-for" className="block text-sm font-medium text-slate-700">
              Кому
            </label>
            <select
              id="comment-for"
              value={forUser}
              onChange={(e) => setForUser(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value={1}>Админу</option>
              <option value={2}>Менеджеру</option>
            </select>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-700 font-medium rounded-lg py-2.5 min-h-[44px] hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            onClick={() => comment.trim() && onApply(comment, role === 1 ? forUser : undefined)}
            disabled={!comment.trim()}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px] disabled:opacity-50"
          >
            Отправить
          </button>
        </div>
      </div>
    </div>
  );
}
