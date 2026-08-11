'use client';

/**
 * Модалка-предупреждение (замена window.confirm), по макету warning-delete-order.png:
 * белая карточка, градиентная шапка, тёмный заголовок, серый текст, Отмена/Действие.
 */
export default function ConfirmModal({
  title,
  message,
  confirmLabel,
  cancelLabel = 'Отмена',
  onConfirm,
  onCancel,
}: {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        </div>
        <div className="px-6 py-4 space-y-5">
          {message && <p className="text-sm text-slate-500">{message}</p>}
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="min-h-[40px] rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              {cancelLabel}
            </button>
            <button
              onClick={onConfirm}
              className="min-h-[40px] rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
