'use client';

import { Order } from '@/lib/api';
import { StatusBadge, formatDate } from '@/components/StatusBadge';

/**
 * Детальная карточка заявки (для app/orders/[id]).
 */
export default function OrderDetails({ order }: { order: Order }) {
  const photos = order.photo
    ? order.photo.split(/\s+/).filter((p) => p && p !== '-')
    : [];

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Дата создания', value: formatDate(order.date_create) },
    { label: 'Дата монтажа', value: formatDate(order.date) },
    { label: 'ТРЦ', value: order.trc + (order.trc_other ? ` (${order.trc_other})` : '') },
    { label: 'Вид работ', value: order.type_work },
    { label: 'Бренд', value: order.brand },
    { label: 'Где печать', value: order.where_print + (order.where_other ? ` (${order.where_other})` : '') },
    { label: 'Стоимость', value: order.price },
    { label: 'Стоимость адм.', value: order.price_admin },
    { label: 'Важность', value: order.importance },
    { label: 'Менеджер', value: order.created_by?.fio || '—' },
    { label: 'Монтажник', value: order.created_for?.fio || '—' },
    { label: 'Комментарий (менеджер)', value: order.comment_manager || '—' },
    { label: 'Комментарий (монтажник)', value: order.comments || '—' },
  ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Шапка */}
      <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between gap-4">
        <h1 className="text-xl font-bold text-slate-900">№{order.id}</h1>
        <StatusBadge status={order.status} archived={order.is_archived} />
      </div>

      {/* Поля */}
      <dl className="divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.label} className="px-6 py-3 grid grid-cols-[140px_1fr] gap-4">
            <dt className="text-sm text-slate-500">{r.label}</dt>
            <dd className="text-sm text-slate-900">{r.value}</dd>
          </div>
        ))}
      </dl>

      {/* Фотопривязка */}
      {photos.length > 0 && (
        <div className="px-6 py-4 border-t border-slate-200">
          <div className="text-sm text-slate-500 mb-2">Фотопривязка</div>
          <div className="flex flex-wrap gap-2">
            {photos.map((p, i) => (
              <a
                key={i}
                href={p}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-indigo-600 hover:underline break-all"
              >
                {p.slice(0, 50)}...
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
