'use client';

import { useState } from 'react';
import Modal from '@/components/Modal';

/**
 * Модалка смены статуса (радио 1/2/3, как legacy).
 * На мобильном выезжает снизу (Drawer), см. components/Modal.
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
    <Modal onClose={onClose}>
      <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
        <h2 className="text-lg font-semibold text-blue-600">Сменить статус</h2>
      </div>

      <div className="px-6 py-4 space-y-4">
        <div className="space-y-2">
          {options.map((o) => (
            <label key={o.value} className="flex items-center gap-2.5 min-h-[44px] p-3 rounded-lg border border-slate-200 hover:bg-slate-50 cursor-pointer">
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
            className="min-h-[44px] rounded-lg border border-blue-600 px-4 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Отмена
          </button>
          <button
            onClick={() => onApply(status)}
            className="min-h-[44px] rounded-lg bg-blue-600 px-4 text-sm font-medium text-white hover:bg-blue-700"
          >
            Применить
          </button>
        </div>
      </div>
    </Modal>
  );
}
