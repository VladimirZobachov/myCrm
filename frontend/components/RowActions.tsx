'use client';

import { useState } from 'react';
import { Order, OrderInput, api } from '@/lib/api';
import StatusModal from '@/components/StatusModal';
import CommentModal from '@/components/CommentModal';
import ConfirmModal from '@/components/ConfirmModal';
import Modal from '@/components/Modal';
import {
  MoreIcon,
  EditIcon,
  CopyIcon,
  CommentIcon,
  ArchiveIcon,
  UnarchiveIcon,
  DeleteIcon,
  StatusChangeIcon,
} from '@/components/icons';

/**
 * Действия в строке заказа (кнопка-«три точки» → дропдаун), по Figma
 * (фрейм 'menu' id=15:1166 / 67:11077): Редактировать, Копировать,
 * Комментарий, В архив (только админ), Удалить (только админ).
 * «Сменить статус» — из старого меню; роль быстрой смены выполняет
 * стрелка у бейджа статуса (см. StatusQuickChange), но полная модалка
 * StatusModal остаётся доступной отсюда же.
 */
export default function RowActions({ order, role, onChanged }: { order: Order; role: number; onChanged: () => void }) {
  const [showMenu, setShowMenu] = useState(false);
  const [showStatus, setShowStatus] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
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

  async function handleCopy() {
    setShowMenu(false);
    setBusy(true);
    try {
      const payload: OrderInput = {
        trc: order.trc,
        trc_other: order.trc_other,
        date: order.date,
        type_work: order.type_work,
        brand: order.brand,
        where_print: order.where_print,
        where_other: order.where_other,
        photo: order.photo,
        price: order.price,
        price_admin: order.price_admin,
        importance: order.importance,
        importance_other: order.importance_other,
        created_for: order.created_for?.id ?? null,
      };
      await api.createOrder(payload);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete() {
    setShowDeleteConfirm(false);
    setBusy(true);
    try {
      await api.deleteOrder(order.id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  const menuItemCls =
    'flex items-center gap-3 min-h-[44px] rounded-lg px-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50 transition-colors disabled:opacity-50';

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
            <a href={`/orders/${order.id}/edit`} className={menuItemCls}>
              <EditIcon /> Редактировать
            </a>
            <button
              onClick={() => { setShowMenu(false); setShowStatus(true); }}
              disabled={busy}
              className={menuItemCls}
            >
              <StatusChangeIcon /> Сменить статус
            </button>
            <button onClick={handleCopy} disabled={busy} className={menuItemCls}>
              <CopyIcon /> Копировать
            </button>
            <button
              onClick={() => { setShowMenu(false); setShowComment(true); }}
              disabled={busy}
              className={menuItemCls}
            >
              <CommentIcon /> Комментарий
            </button>
            {role === 1 && (
              <button onClick={toggleArchive} disabled={busy} className={menuItemCls}>
                {order.is_archived ? <UnarchiveIcon /> : <ArchiveIcon />}
                {order.is_archived ? 'Разархивировать' : 'В архив'}
              </button>
            )}
            {role === 1 && (
              <button
                onClick={() => { setShowMenu(false); setShowDeleteConfirm(true); }}
                disabled={busy}
                className={`${menuItemCls} text-red-600 hover:bg-red-50`}
              >
                <DeleteIcon /> Удалить
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

      {showDeleteConfirm && (
        <ConfirmModal
          title="Удалить заказ?"
          message="Внимание! После удаления все пропадет!"
          confirmLabel="Удалить"
          onCancel={() => setShowDeleteConfirm(false)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  );
}
