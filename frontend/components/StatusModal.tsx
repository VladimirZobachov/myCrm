'use client';

import { useState } from 'react';

/**
 * Модалка смены статуса (радио 1/2/3, как legacy).
 */
export default function StatusModal({
  current,
  onClose,
  onApply,
}: {
  current: number;
  onClose: () => void;
  onApply: (status: number) => void;
}) {
  const [status, setStatus] = useState(current);

  const options = [
    { value: 1, label: 'В ожидании' },
    { value: 2, label: 'Принят' },
    { value: 3, label: 'Выполнено' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-semibold text-slate-900">Сменить статус</h2>

        <div className="space-y-2">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
              <input
                type="radio"
                name="status"
                value={o.value}
                checked={status === o.value}
                onChange={() => setStatus(o.value)}
                className="accent-indigo-600"
              />
              <span className="text-sm text-slate-800">{o.label}</span>
            </label>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 border border-slate-300 text-slate-700 font-medium rounded-lg py-2.5 min-h-[44px] hover:bg-slate-50"
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(status)}
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px]"
          >
            Применить
          </button>
        </div>
      </div>
    </div>
  );
}
