'use client';

import { useState } from 'react';
import { Order, api } from '@/lib/api';
import { StatusBadge, STATUS_OPTIONS } from '@/components/StatusBadge';
import { CheckIcon } from '@/components/icons';

/**
 * Быстрая смена статуса в таблице/карточке (по Figma: бейдж + стрелка ▼,
 * id=I14:469;29:1154). Клик по стрелке открывает компактный дропдаун
 * (ждет/принят/готов, текущий отмечен ✓) — выбор сразу шлёт PATCH
 * /orders/{id}/status, без промежуточной модалки (та осталась в ⋮ меню,
 * см. RowActions → StatusModal).
 */
export default function StatusQuickChange({ order, onChanged }: { order: Order; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function choose(status: number) {
    setOpen(false);
    if (status === order.status) return;
    setBusy(true);
    try {
      await api.updateStatus(order.id, status);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  if (order.is_archived) {
    return <StatusBadge status={order.status} archived={order.is_archived} />;
  }

  return (
    <div className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        disabled={busy}
        aria-label="Сменить статус"
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center disabled:opacity-50"
      >
        <StatusBadge status={order.status} withCaret />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            role="listbox"
            aria-label="Статус"
            className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 shadow-lg"
          >
            {STATUS_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                role="option"
                aria-selected={order.status === o.value}
                onClick={() => choose(o.value)}
                className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                <span>{o.label}</span>
                {order.status === o.value && <CheckIcon />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
