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
    { value: 1, label: 'ждет' },
    { value: 2, label: 'принят' },
    { value: 3, label: 'готов' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="w-full max-w-sm rounded-2xl bg-white shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-600">Сменить статус</h2>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            {options.map((o) => (
              <label key={o.value} className="flex items-center gap-2.5 p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  value={o.value}
                  checked={status === o.value}
                  onChange={() => setStatus(o.value)}
                  className="accent-blue-600 size-4"
                />
                <span className="text-sm text-slate-800">{o.label}</span>
              </label>
            ))}
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="min-h-[40px] rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50"
            >
              Отмена
            </button>
            <button
              onClick={() => onApply(status)}
              className="min-h-[40px] rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
            >
              Применить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
