'use client';

import { Order } from '@/lib/api';
import { StatusBadge, formatDate } from '@/components/StatusBadge';
import RowActions from '@/components/RowActions';

// Ролевая видимость колонок (1:1 с legacy index.php table_headers)
// type_user: 1=админ, 2=менеджер, 3=монтажник
interface Column {
  key: string;
  label: string;
  sortable?: boolean;
  visibleFor: number[]; // роли, которым видна колонка
  render: (o: Order) => React.ReactNode;
}

const COLUMNS: Column[] = [
  {
    key: 'id', label: '№', sortable: true, visibleFor: [1, 2, 3],
    render: (o) => <span className="text-slate-500">{o.id}</span>,
  },
  {
    key: 'date_create', label: 'Отметка времени', sortable: true, visibleFor: [1, 2, 3],
    render: (o) => <span className="text-slate-500">{formatDate(o.date_create)}</span>,
  },
  {
    key: 'date', label: 'Дата монтажа', sortable: true, visibleFor: [1, 2, 3],
    render: (o) => formatDate(o.date),
  },
  {
    key: 'trc', label: 'ТРЦ', sortable: true, visibleFor: [1, 2, 3],
    render: (o) => <span className="font-medium text-slate-800">{o.trc}</span>,
  },
  {
    key: 'type_work', label: 'Вид работ', visibleFor: [1, 2, 3],
    render: (o) => <span className="text-slate-600 max-w-[260px] block truncate">{o.type_work}</span>,
  },
  {
    key: 'brand', label: 'Бренд', visibleFor: [1, 2, 3],
    render: (o) => o.brand,
  },
  {
    key: 'where_print', label: 'Где печать', visibleFor: [1, 2, 3],
    render: (o) => o.where_print,
  },
  {
    key: 'photo', label: 'Фотопривязка', visibleFor: [1, 2, 3],
    render: (o) =>
      o.photo && o.photo !== '-' ? (
        <a href={o.photo.split(' ')[0]} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline text-xs">
          фото
        </a>
      ) : <span className="text-slate-300">—</span>,
  },
  {
    key: 'created_by', label: 'Менеджер', visibleFor: [1, 2], // legacy: type != 3
    render: (o) => o.created_by?.fio || '—',
  },
  {
    key: 'created_for', label: 'Монтажник', visibleFor: [1], // legacy: type == 1
    render: (o) => o.created_for?.fio || '—',
  },
  {
    key: 'price', label: 'Ст-ть', sortable: true, visibleFor: [1, 2, 3],
    render: (o) => <span className="text-slate-800">{o.price}</span>,
  },
  {
    key: 'price_admin', label: 'Ст-ть адм.', visibleFor: [1], // legacy: type == 1
    render: (o) => <span className="text-slate-500">{o.price_admin}</span>,
  },
  {
    key: 'importance', label: 'Важность', visibleFor: [1, 2, 3],
    render: (o) => o.importance,
  },
  {
    key: 'status', label: 'Статус', sortable: true, visibleFor: [1, 2, 3],
    render: (o) => <StatusBadge status={o.status} archived={o.is_archived} />,
  },
  {
    key: 'comments', label: 'Ком-ии', visibleFor: [1, 2, 3],
    render: (o) => (o.comments ? <span className="text-slate-600 max-w-[120px] block truncate">{o.comments}</span> : <span className="text-slate-300">—</span>),
  },
  {
    key: 'comment_manager', label: 'Ком-ий мен.', visibleFor: [1], // legacy: type == 1
    render: (o) => (o.comment_manager ? <span className="text-slate-600 max-w-[120px] block truncate">{o.comment_manager}</span> : <span className="text-slate-300">—</span>),
  },
  {
    key: 'actions', label: 'Действия', visibleFor: [1, 2, 3],
    render: (o) => <RowActions order={o} role={1} onChanged={() => {}} />,
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

  return (
    <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left text-slate-500">
            {visible.map((c) => (
              <th
                key={c.key}
                onClick={c.sortable ? () => onSort(c.key) : undefined}
                className={`px-3 py-3 font-medium whitespace-nowrap ${c.sortable ? 'cursor-pointer hover:text-slate-700' : ''}`}
              >
                {c.label}
                {c.sortable && sort.startsWith(c.key) && (
                  <span className="ml-1 text-indigo-600">{sort.endsWith('ASC') ? '↑' : '↓'}</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {orders.map((o) => (
            <tr key={o.id} className="hover:bg-slate-50">
              {visible.map((c) => (
                <td key={c.key} className="px-3 py-3 whitespace-nowrap">
                  {c.key === 'actions'
                    ? <RowActions order={o} role={role} onChanged={onChanged} />
                    : c.render(o)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
