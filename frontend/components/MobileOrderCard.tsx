'use client';

import { useState } from 'react';
import { Order } from '@/lib/api';
import { StatusBadge, formatDate } from '@/components/StatusBadge';
import { importanceBadge } from '@/lib/constants';
import RowActions from '@/components/RowActions';
import PhotoGallery from '@/components/PhotoGallery';
import StatusQuickChange from '@/components/StatusQuickChange';

/**
 * Мобильная карточка заказа — аккордеон (по требованию клиента, 13.08.2026).
 * Свёрнутая строка (обновлено 13.08.2026): дата монтажа, ТРЦ, цена, статус — вместо номера заявки.
 * Тап разворачивает все поля. Каждая карточка хранит своё состояние независимо.
 */
export default function MobileOrderCard({ order: o, role, onChanged }: { order: Order; role: number; onChanged: () => void }) {
  const [open, setOpen] = useState(false);
  const imp = importanceBadge(o.importance);

  const rows: [string, React.ReactNode][] = [
    ['Важность:', <span key="imp" className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${imp.cls}`}>{imp.label}</span>],
    ['Дата создания:', formatDate(o.date_create)],
    ['ТРЦ:', <span key="trc" className="font-semibold text-slate-900">{o.trc}</span>],
    ['Бренд:', o.brand],
    ['Вид работ:', o.type_work],
    ['Менеджер:', o.created_by?.fio || '—'],
    ...(role === 1 ? ([['Монтажник:', o.created_for?.fio || '—']] as [string, React.ReactNode][]) : []),
    ['Где печать:', o.where_print],
    ['Фото:', <PhotoGallery key="photo" photos={o.photos} legacyPhoto={o.photo} variant="compact" max={3} />],
    ['Комментарий монтажнику:', o.comments || '—'],
  ];

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={`Заявка №${o.id}`}
        className="w-full min-h-[44px] flex items-center justify-between gap-2 px-4 py-3 text-left"
      >
        <span className="flex flex-wrap items-center gap-x-3 gap-y-1 min-w-0">
          <span className="text-sm font-semibold text-slate-900 whitespace-nowrap">{formatDate(o.date)}</span>
          <span className="text-sm text-slate-600 truncate">{o.trc}</span>
          <span className="text-sm font-medium text-slate-900 tabular-nums whitespace-nowrap">{o.price}</span>
          <StatusBadge status={o.status} archived={o.is_archived} />
        </span>
        <svg
          aria-hidden
          viewBox="0 0 20 20"
          className={`size-4 text-slate-400 shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        >
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div className="px-4 pb-4 border-t border-slate-100">
          <div className="grid grid-cols-2 gap-2 py-3 border-b border-slate-100">
            <div>
              <div className="text-xs text-slate-400">Дата монтажа:</div>
              <div className="text-slate-900 font-medium">{formatDate(o.date)}</div>
            </div>
            <div>
              <div className="text-xs text-slate-400">Стоимость:</div>
              <div className="text-slate-900 font-medium tabular-nums">
                {o.price}
                {role === 1 && <span className="text-xs text-slate-400 font-normal"> адм. {o.price_admin}</span>}
              </div>
            </div>
          </div>

          <dl className="divide-y divide-slate-100">
            {rows.map(([label, value]) => (
              <div key={label} className="py-2 text-sm">
                <dt className="text-xs text-slate-400">{label}</dt>
                <dd className="text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>

          <div className="flex items-center justify-between pt-3 mt-1 border-t border-slate-100">
            <RowActions order={o} role={role} onChanged={onChanged} />
            <StatusQuickChange order={o} onChanged={onChanged} />
          </div>
        </div>
      )}
    </div>
  );
}
