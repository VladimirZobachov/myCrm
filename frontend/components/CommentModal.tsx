'use client';

import { useState } from 'react';

/**
 * Модалка комментария (legacy updateComment):
 * - textarea для текста
 * - селект «кому» (for=1 админу, for=2 менеджеру) — только для админа
 *
 * Примечание: в Figma-макете (add-comment.png) «Кому» — радио-кнопки
 * «Менеджеру / Монтажнику». Здесь оставлен селект «Админу / Менеджеру»,
 * т.к. структура и опции пиннятся тестами (Modals.test.tsx) — приоритет тесту.
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
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-600">Комментарий</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-1">
            <label htmlFor="comment-text" className="block text-sm font-medium text-slate-700">
              Комментарий *
            </label>
            <textarea
              id="comment-text"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={1}>Админу</option>
                <option value={2}>Менеджеру</option>
              </select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Отмена
            </button>
            <button
              onClick={() => comment.trim() && onApply(comment, role === 1 ? forUser : undefined)}
              disabled={!comment.trim()}
              className="min-h-[40px] rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Отправить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
