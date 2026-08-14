'use client';

import { useEffect, useState } from 'react';
import { api, Order, Paginated, User } from '@/lib/api';
import OrdersTable from '@/components/OrdersTable';
import ExportModal from '@/components/ExportModal';
import ConfirmModal from '@/components/ConfirmModal';
import BatchActions from '@/components/BatchActions';
import MobileOrderCard from '@/components/MobileOrderCard';
import { mergeManualOrder } from '@/lib/orderPositions';
import { RowDragSensor } from '@/lib/dnd';
import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, arrayMove, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';

function AccountIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <circle cx="12" cy="8" r="3.2" />
      <path d="M4.5 20c1.4-3.6 4.4-5.5 7.5-5.5s6.1 1.9 7.5 5.5" strokeLinecap="round" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.7">
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 16l5-4-5-4M15 12H3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}

function NavTab({ active, href, onClick, children }: { active: boolean; href?: string; onClick?: () => void; children: React.ReactNode }) {
  const cls = `min-h-[44px] px-1 flex items-center text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
    active ? 'text-blue-600 border-blue-600' : 'text-slate-600 border-transparent hover:text-slate-900'
  }`;
  if (href) return <a href={href} className={cls}>{children}</a>;
  return <button onClick={onClick} className={cls}>{children}</button>;
}

function Pagination({ page, lastPage, onPage }: { page: number; lastPage: number; onPage: (p: number) => void }) {
  const numbers = Array.from({ length: Math.min(3, lastPage) }, (_, i) => i + 1);
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {numbers.map((n) => (
        <button
          key={n}
          onClick={() => onPage(n)}
          className={`min-h-[44px] min-w-[44px] rounded-lg text-sm font-medium transition-colors ${
            page === n ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
          }`}
        >
          {n}
        </button>
      ))}
      {lastPage > 3 && <span className="px-1 text-slate-400">...</span>}
      <button
        onClick={() => onPage(Math.min(lastPage, page + 1))}
        disabled={page === lastPage}
        className="min-h-[44px] px-4 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white"
      >
        Вперед
      </button>
    </div>
  );
}

export default function OrdersPage() {
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [sort, setSort] = useState('date_create|DESC');
  // Ручной (drag-and-drop) порядок применяется по умолчанию при загрузке
  // (запрос без ?sort= — бэкенд сам подставит order_positions пользователя).
  // Клик по заголовку колонки включает обычную сортировку до перезагрузки
  // страницы (см. OrderController::index).
  const [sortExplicit, setSortExplicit] = useState(false);
  const [positions, setPositions] = useState<number[] | null>(null);
  const [role, setRole] = useState<number>(1); // из /auth/me
  const [me, setMe] = useState<User | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  function toggleSelect(id: number) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll(checked: boolean) {
    setSelectedIds(checked && data ? new Set(data.data.map((o) => o.id)) : new Set());
  }

  function fetchOrders() {
    setLoading(true);
    setError('');
    const params: Record<string, string | number | boolean> = { page, archived: archived ? 1 : 0 };
    if (sortExplicit) params.sort = sort;
    return api
      .orders(params)
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    api
      .me()
      .then((res) => { setRole(res.user.type_user); setMe(res.user); })
      .catch(() => {});
    api
      .getOrderPositions()
      .then((res) => setPositions(res.order_ids))
      .catch(() => {});
    fetchOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, archived, sort, sortExplicit]);

  function toggleSort(field: string) {
    const [cur, dir] = sort.split('|');
    setSort(`${field}|${cur === field && dir === 'DESC' ? 'ASC' : 'DESC'}`);
    setSortExplicit(true);
  }

  function reload() {
    fetchOrders();
  }

  // Drag-and-drop: пользователь переставил заявки на текущей странице.
  // Обновляем список локально (оптимистично) и сохраняем в БД полный
  // ручной порядок (см. mergeManualOrder — вклеивает страницу в ранее
  // известный порядок, не теряя позиции заявок с других страниц).
  function handleReorder(newPageOrderIds: number[]) {
    if (!data) return;

    const byId = new Map(data.data.map((o) => [o.id, o]));
    const reordered = newPageOrderIds.map((id) => byId.get(id)).filter((o): o is Order => !!o);
    setData({ ...data, data: reordered });

    const merged = mergeManualOrder(positions, newPageOrderIds);
    setPositions(merged);
    setSortExplicit(false);

    api.saveOrderPositions(merged).catch(() => {});
  }

  // Мобильные карточки перетаскиваются целиком (без ручки) — обычный тап
  // должен раскрывать аккордеон, поэтому drag активируется только долгим
  // тапом (delay), а не сразу при касании (задача 14.08.2026).
  const dndSensors = useSensors(
    useSensor(RowDragSensor, { activationConstraint: { delay: 250, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleMobileDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!data || !over || active.id === over.id) return;

    const oldIndex = data.data.findIndex((o) => o.id === active.id);
    const newIndex = data.data.findIndex((o) => o.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    handleReorder(arrayMove(data.data, oldIndex, newIndex).map((o) => o.id));
  }

  async function doLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  }

  return (
    <main className="min-h-dvh bg-slate-100">
      {/* Топ-панель: десктоп (lg+) — одна строка, как раньше */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20">
        <div className="hidden lg:flex max-w-7xl mx-auto px-4 h-[60px] items-center gap-6">
          <span className="text-2xl font-light text-slate-400 tracking-wide flex-none">CRM</span>

          <nav className="flex items-center gap-6 flex-none">
            <NavTab active={!archived} onClick={() => { setArchived(false); setPage(1); }}>Заказы</NavTab>
            <NavTab active={archived} onClick={() => { setArchived(true); setPage(1); }}>Архив</NavTab>
            <NavTab active={false} href="/users">Пользователи</NavTab>
          </nav>

          <div className="flex items-center gap-2">
            <a
              href="/orders/new"
              className="h-9 px-3.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium flex items-center gap-1.5"
            >
              <span className="text-base leading-none">+</span> Новый заказ
            </a>
            <button
              onClick={() => setShowExport(true)}
              className="h-9 px-3.5 rounded-lg border border-blue-600 text-blue-600 hover:bg-blue-50 text-sm font-medium"
            >
              Экспорт
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-3 flex-none">
            <span className="text-sm text-slate-700 hidden sm:inline">{me?.fio || me?.login || ''}</span>
            <a href="/profile" title="Аккаунт" className="text-slate-500 hover:text-slate-800">
              <AccountIcon />
            </a>
            <button onClick={() => setShowLogoutConfirm(true)} title="Выйти" className="text-slate-500 hover:text-slate-800">
              <LogoutIcon />
            </button>
          </div>
        </div>

        {/* Мобильная топ-панель: логотип + аккаунт/выход, ниже — вкладки и экспорт
            (компактно, чтобы не было горизонтального скролла страницы на 320px) */}
        <div className="lg:hidden">
          <div className="flex items-center justify-between px-2 h-14">
            <span className="text-xl font-light text-slate-400 tracking-wide pl-2">CRM</span>
            <div className="flex items-center">
              <a
                href="/profile"
                title="Аккаунт"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-800"
              >
                <AccountIcon />
              </a>
              <button
                onClick={() => setShowLogoutConfirm(true)}
                title="Выйти"
                className="flex items-center justify-center min-h-[44px] min-w-[44px] text-slate-500 hover:text-slate-800"
              >
                <LogoutIcon />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-4 px-3 pb-1 overflow-x-auto">
            <NavTab active={!archived} onClick={() => { setArchived(false); setPage(1); }}>Заказы</NavTab>
            <NavTab active={archived} onClick={() => { setArchived(true); setPage(1); }}>Архив</NavTab>
            <NavTab active={false} href="/users">Пользователи</NavTab>
            <button
              onClick={() => setShowExport(true)}
              className="ml-auto min-h-[44px] px-3 rounded-lg border border-blue-600 text-blue-600 text-sm font-medium whitespace-nowrap"
            >
              Экспорт
            </button>
          </div>
        </div>
      </header>

      {/* Плавающая кнопка «Новый заказ» — мобильный, всегда в thumb-зоне (низ-справа) */}
      <a
        href="/orders/new"
        aria-label="Новый заказ"
        className="lg:hidden fixed z-30 flex items-center justify-center size-14 rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
        style={{ bottom: 'max(1.25rem, env(safe-area-inset-bottom))', right: '1.25rem' }}
      >
        <PlusIcon />
      </a>

      <div className="max-w-7xl mx-auto px-4 pt-6 pb-[calc(6rem+env(safe-area-inset-bottom))] lg:pb-6 space-y-4">
        {error && data && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">{error}</div>}

        {error && !data && !loading && (
          <div className="bg-white rounded-xl border border-red-200 shadow-sm p-10 text-center space-y-4">
            <p className="text-red-700 font-medium">Не удалось загрузить заявки</p>
            <p className="text-sm text-slate-500">{error}</p>
            <button
              onClick={reload}
              className="min-h-[44px] px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium"
            >
              Повторить
            </button>
          </div>
        )}

        {loading && <div className="text-center py-10 text-slate-400">Загрузка...</div>}

        {data && !loading && (
          <>
            {/* Десктоп: таблица (ролевые колонки) */}
            <OrdersTable orders={data.data} role={role} sort={sort} onSort={toggleSort} onChanged={reload} onReorder={handleReorder} selectedIds={selectedIds} onToggleSelect={toggleSelect} onToggleSelectAll={toggleSelectAll} />

            {/* Мобильный: карточки-аккордеон (свёрнуты до № + важность, тап разворачивает).
                Долгий тап по карточке перетаскивает её — тот же ручной порядок, что и на десктопе. */}
            <div className="lg:hidden space-y-3">
              {data.data.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
                  Заявок не найдено
                </div>
              )}
              <DndContext sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={handleMobileDragEnd}>
                <SortableContext items={data.data.map((o) => o.id)} strategy={verticalListSortingStrategy}>
                  {data.data.map((o) => (
                    <MobileOrderCard key={o.id} order={o} role={role} onChanged={reload} selected={selectedIds.has(o.id)} onToggleSelect={toggleSelect} />
                  ))}
                </SortableContext>
              </DndContext>
            </div>

            {/* Пагинация: 1 2 3 ... Вперед */}
            {data.last_page > 1 && (
              <Pagination page={data.current_page} lastPage={data.last_page} onPage={setPage} />
            )}
          </>
        )}
      </div>

      {showExport && <ExportModal role={role} onClose={() => setShowExport(false)} />}
      {showLogoutConfirm && (
        <ConfirmModal
          title="Выйти из системы?"
          confirmLabel="Выйти"
          onCancel={() => setShowLogoutConfirm(false)}
          onConfirm={doLogout}
        />
      )}

      <BatchActions selectedIds={selectedIds} role={role} onDone={() => { setSelectedIds(new Set()); reload(); }} />
    </main>
  );
}
