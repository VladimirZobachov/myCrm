'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';
import { MoreIcon, EditIcon, DeleteIcon } from '@/components/icons';

/**
 * Действия в строке пользователя (⋮), по Figma-макету 'menu users' (id=48:3228):
 * Редактировать, Удалить.
 */
export default function UserRowActions({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [showMenu, setShowMenu] = useState(false);

  const menuItemCls =
    'flex items-center gap-3 min-h-[44px] rounded-lg px-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors';

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setShowMenu(true)}
        aria-label="Действия"
        className="flex items-center justify-center min-h-[44px] min-w-[44px] rounded-full text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
      >
        <MoreIcon />
      </button>

      {showMenu && (
        <Modal onClose={() => setShowMenu(false)} maxWidth="sm:max-w-xs">
          <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
            <h2 className="text-lg font-semibold text-blue-600">Действия</h2>
          </div>
          <div className="px-4 py-3 flex flex-col">
            <button onClick={() => { setShowMenu(false); onEdit(); }} className={menuItemCls}>
              <EditIcon /> Редактировать
            </button>
            <button
              onClick={() => { setShowMenu(false); onDelete(); }}
              className={`${menuItemCls} text-red-600 hover:bg-red-50`}
            >
              <DeleteIcon /> Удалить
            </button>
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
    </div>
  );
}
