'use client';

import { Order } from '@/lib/api';
import { formatDate } from '@/components/StatusBadge';
import { importanceBadge } from '@/lib/constants';
import RowActions from '@/components/RowActions';
import PhotoGallery from '@/components/PhotoGallery';
import StatusQuickChange from '@/components/StatusQuickChange';

// Ролевая видимость колонок (1:1 с legacy index.php table_headers)
// type_user: 1=админ, 2=менеджер, 3=монтажник
// «Стоимость» объединяет пары полей (price/price_admin) в одну колонку —
// см. Figma Frame 290. Колонка «Комментарий» убрана из таблицы по запросу
// клиента — комментарии доступны в модалке действий (RowActions) и на
// карточке заказа (OrderDetails).
// «Исполнители» объединяет created_by/created_for (Менеджер/Монтажник).
// «Вид работ / Бренд» объединяет type_work/brand — бренд мелким серым под
// видом работ, скрывается, если пустой.
// «№» объединяет id + date_create, «Дата монтажа» объединяет date + trc —
// по уточнённому прототипу (Figma Frame 286+291, 272+292), чтобы убрать
// горизонтальный скролл. Заголовок при этом хранит обе сортируемые метки
// (каждая кликается отдельно), см. HeaderPart.
interface HeaderPart {
  key: string;
  label: string;
  sortable?: boolean;
}

interface Column {
  key: string;
  headers: HeaderPart[]; // 1-2 подписи, стек — каждая сортируется независимо
  visibleFor: number[]; // роли, которым видна колонка
  render: (o: Order, role: number) => React.ReactNode;
}

function SortIcon({ active, dir }: { active: boolean; dir: 'ASC' | 'DESC' }) {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="inline-block size-3 ml-1 align-middle">
      <path
        d="M6 8l4-4 4 4"
        fill="none"
        stroke={active && dir === 'ASC' ? '#2563eb' : '#cbd5e1'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 12l4 4 4-4"
        fill="none"
        stroke={active && dir === 'DESC' ? '#2563eb' : '#cbd5e1'}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const COLUMNS: Column[] = [
  {
    key: 'actions', headers: [], visibleFor: [1, 2, 3],
    render: () => null, // рендерится отдельно в tbody — нужен role и onChanged
  },
  {
    key: 'id', headers: [{ key: 'id', label: '№', sortable: true }], visibleFor: [1, 2, 3],
    render: (o) => (
      <div>
        <div className="font-semibold text-slate-900 whitespace-nowrap">№{o.id}</div>
        <div className="text-xs text-slate-400 mt-0.5 whitespace-nowrap">{formatDate(o.date_create)}</div>
      </div>
    ),
  },
  {
    key: 'date_trc',
    headers: [
      { key: 'date', label: 'Дата монтажа', sortable: true },
      { key: 'trc', label: 'ТРЦ', sortable: true },
    ],
    visibleFor: [1, 2, 3],
    render: (o) => (
      <div>
        <div className="text-slate-900 whitespace-nowrap">{formatDate(o.date)}</div>
        <a href={`/orders/${o.id}`} className="font-semibold text-slate-900 hover:text-blue-600 hover:underline whitespace-nowrap">{o.trc}</a>
      </div>
    ),
  },
  {
    key: 'importance', headers: [{ key: 'importance', label: 'Важность' }], visibleFor: [1, 2, 3],
    render: (o) => {
      const b = importanceBadge(o.importance);
      return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium whitespace-nowrap ${b.cls}`}>
          {b.label}
        </span>
      );
    },
  },
  {
    key: 'type_work_brand',
    headers: [
      { key: 'type_work', label: 'Вид работ' },
      { key: 'brand', label: 'Бренд' },
    ],
    visibleFor: [1, 2, 3],
    render: (o) => (
      <div className="min-w-[160px] max-w-[280px]">
        <div className="text-slate-600 whitespace-normal break-words">{o.type_work}</div>
        {o.brand && <div className="text-xs text-slate-400 mt-0.5 whitespace-normal break-words">{o.brand}</div>}
      </div>
    ),
  },
  {
    key: 'where_print', headers: [{ key: 'where_print', label: 'Где печать' }], visibleFor: [1, 2, 3],
    render: (o) => <span className="text-slate-700">{o.where_print}</span>,
  },
  {
    key: 'photo', headers: [{ key: 'photo', label: 'Фото' }], visibleFor: [1, 2, 3],
    render: (o) => <PhotoGallery photos={o.photos} legacyPhoto={o.photo} variant="compact" max={3} />,
  },
  {
    key: 'executors', headers: [{ key: 'executors', label: 'Исполнители' }], visibleFor: [1, 2], // legacy: type != 3
    render: (o, role) => (
      <div className="space-y-0.5 text-slate-700">
        <div><span className="text-slate-400">Менеджер:</span> {o.created_by?.fio || '—'}</div>
        {role === 1 && (
          <div><span className="text-slate-400">Монтажник:</span> {o.created_for?.fio || '—'}</div>
        )}
      </div>
    ),
  },
  {
    key: 'price', headers: [{ key: 'price', label: 'Стоимость', sortable: true }], visibleFor: [1, 2, 3],
    render: (o, role) => (
      <div>
        <div className="font-semibold text-slate-900 tabular-nums">{o.price}</div>
        {role === 1 && (
          <div className="text-xs text-slate-400 tabular-nums mt-0.5">адм. {o.price_admin}</div>
        )}
      </div>
    ),
  },
  {
    key: 'status', headers: [{ key: 'status', label: 'Статус', sortable: true }], visibleFor: [1, 2, 3],
    render: () => null, // рендерится отдельно в tbody — нужен onChanged (см. actions)
  },
];

export default function OrdersTable({
  orders,
  role,
  sort,
  onSort,
  onChanged,
}: {
  orders: Order[];
  role: number;
  sort: string;
  onSort: (field: string) => void;
  onChanged: () => void;
}) {
  const visible = COLUMNS.filter((c) => c.visibleFor.includes(role));
  const [sortField, sortDir] = sort.split('|') as [string, 'ASC' | 'DESC'];
  // Второстепенные колонки (короткое содержимое) получают более узкий
  // паддинг, чтобы освободить место колонке «Вид работ / Бренд» и не
  // выходить за max-w-7xl (1280px) — без этого таблица требовала
  // горизонтального скролла.
  const compactPad = (key: string) => (['importance', 'photo', 'where_print', 'status'].includes(key) ? 'px-2' : 'px-4');

  return (
    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200">
          <tr className="text-left text-slate-500">
            {visible.map((c) => (
              <th key={c.key} className={`${compactPad(c.key)} py-3 text-xs font-semibold whitespace-nowrap ${c.key === 'actions' ? 'w-10' : ''}`}>
                <div className="flex flex-col gap-1">
                  {c.headers.map((h) => (
                    <span
                      key={h.key}
                      onClick={h.sortable ? () => onSort(h.key) : undefined}
                      className={`inline-flex items-center ${h.sortable ? 'cursor-pointer select-none hover:text-slate-700' : ''}`}
                    >
                      {h.label}
                      {h.sortable && <SortIcon active={sortField === h.key} dir={sortDir} />}
                    </span>
                  ))}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => (
            <tr
              key={o.id}
              className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors align-top"
            >
              {visible.map((c) => (
                <td key={c.key} className={`${compactPad(c.key)} py-3 ${c.key === 'actions' ? 'whitespace-nowrap' : ''}`}>
                  {c.key === 'actions'
                    ? <RowActions order={o} role={role} onChanged={onChanged} />
                    : c.key === 'status'
                    ? <StatusQuickChange order={o} onChanged={onChanged} />
                    : c.render(o, role)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
