'use client';

import { Order } from '@/lib/api';
import { formatDate } from '@/components/StatusBadge';
import { importanceBadge } from '@/lib/constants';
import RowActions from '@/components/RowActions';
import PhotoGallery from '@/components/PhotoGallery';
import StatusQuickChange from '@/components/StatusQuickChange';
import { RowDragSensor } from '@/lib/dnd';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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
// Ручной порядок заявок (сохраняется в БД для каждого пользователя, задача
// 13.08.2026) перетаскивается за всю строку — отдельной ручки-«точек» нет,
// чтобы не расширять строку вторым набором точек рядом с ⋮ (RowActions) и
// не вызывать горизонтальный скролл (задача 14.08.2026). Drag активируется
// зажатием в любом месте строки, кроме интерактивных элементов — см.
// RowDragSensor.
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
    key: 'select', headers: [], visibleFor: [1, 2, 3],
    render: () => null, // рендерится отдельно в tbody — нужен selectedIds/onToggleSelect
  },
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

function SortableRow({
  order: o,
  visible,
  role,
  onChanged,
  compactPad,
  selectionMode,
  selected,
  onToggleSelect,
}: {
  order: Order;
  visible: Column[];
  role: number;
  onChanged: () => void;
  compactPad: (key: string) => string;
  selectionMode: boolean;
  selected: boolean;
  onToggleSelect: (id: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: o.id,
    attributes: { role: 'row', roleDescription: `Заявка №${o.id}, зажмите и перетащите для изменения порядка` },
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors align-top cursor-grab active:cursor-grabbing"
    >
      {visible.map((c) => (
        <td key={c.key} className={`${compactPad(c.key)} py-3 ${c.key === 'actions' ? 'whitespace-nowrap' : ''}`}>
          {c.key === 'select' ? (
            selectionMode && (
              <input
                type="checkbox"
                aria-label={`Выбрать заявку №${o.id}`}
                checked={selected}
                onChange={() => onToggleSelect(o.id)}
                onClick={(e) => e.stopPropagation()}
                className="size-[18px] accent-indigo-600 cursor-pointer animate-check-in"
              />
            )
          ) : c.key === 'actions' ? (
            <RowActions order={o} role={role} onChanged={onChanged} />
          ) : c.key === 'status' ? (
            <StatusQuickChange order={o} onChanged={onChanged} />
          ) : (
            c.render(o, role)
          )}
        </td>
      ))}
    </tr>
  );
}

export default function OrdersTable({
  orders,
  role,
  sort,
  onSort,
  onChanged,
  onReorder,
  selectionMode = false,
  selectedIds = new Set<number>(),
  onToggleSelect = () => {},
  onToggleSelectionMode = () => {},
}: {
  orders: Order[];
  role: number;
  sort: string;
  onSort: (field: string) => void;
  onChanged: () => void;
  onReorder?: (orderIds: number[]) => void;
  selectionMode?: boolean;
  selectedIds?: Set<number>;
  onToggleSelect?: (id: number) => void;
  onToggleSelectionMode?: (checked: boolean) => void;
}) {
  const visible = COLUMNS.filter((c) => c.visibleFor.includes(role));
  const [sortField, sortDir] = sort.split('|') as [string, 'ASC' | 'DESC'];
  // Второстепенные колонки (короткое содержимое) получают более узкий
  // паддинг, чтобы освободить место колонке «Вид работ / Бренд» и не
  // выходить за max-w-7xl (1280px) — без этого таблица требовала
  // горизонтального скролла.
  const compactPad = (key: string) => (['select', 'importance', 'photo', 'where_print', 'status'].includes(key) ? 'px-2' : 'px-4');
  const allSelected = selectionMode && orders.length > 0 && orders.every((o) => selectedIds.has(o.id));

  const sensors = useSensors(
    useSensor(RowDragSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!onReorder || !over || active.id === over.id) return;

    const oldIndex = orders.findIndex((o) => o.id === active.id);
    const newIndex = orders.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    onReorder(arrayMove(orders, oldIndex, newIndex).map((o) => o.id));
  }

  return (
    <div className="hidden lg:block bg-white rounded-2xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="border-b border-slate-200">
          <tr className="text-left text-slate-500">
            {visible.map((c) => (
              <th key={c.key} className={`${compactPad(c.key)} py-3 text-xs font-semibold whitespace-nowrap ${c.key === 'actions' ? 'w-10' : ''}`}>
                {c.key === 'select' ? (
                  <label className="inline-flex items-center gap-1.5 font-normal text-slate-600 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      aria-label="Выбрать"
                      checked={allSelected}
                      onChange={(e) => onToggleSelectionMode(e.target.checked)}
                      className="size-[18px] accent-indigo-600 cursor-pointer"
                    />
                    <span>Выбрать</span>
                  </label>
                ) : (
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
                )}
              </th>
            ))}
          </tr>
        </thead>
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={orders.map((o) => o.id)} strategy={verticalListSortingStrategy}>
            <tbody>
              {orders.map((o) => (
                <SortableRow
                  key={o.id}
                  order={o}
                  visible={visible}
                  role={role}
                  onChanged={onChanged}
                  compactPad={compactPad}
                  selectionMode={selectionMode}
                  selected={selectedIds.has(o.id)}
                  onToggleSelect={onToggleSelect}
                />
              ))}
            </tbody>
          </SortableContext>
        </DndContext>
      </table>
    </div>
  );
}
