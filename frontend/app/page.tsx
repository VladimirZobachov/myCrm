'use client';

import { useEffect, useState } from 'react';
import { api, Order, Paginated } from '@/lib/api';
import { StatusBadge, formatDate } from '@/components/StatusBadge';
import OrdersTable from '@/components/OrdersTable';
import ExportModal from '@/components/ExportModal';

export default function OrdersPage() {
  const [data, setData] = useState<Paginated<Order> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [archived, setArchived] = useState(false);
  const [status, setStatus] = useState('');
  const [sort, setSort] = useState('date_create|DESC');
  const [role, setRole] = useState<number>(1); // из /auth/me
  const [showExport, setShowExport] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .me()
      .then((me) => setRole(me.user.type_user))
      .catch(() => {});
    api
      .orders({ page, archived: archived ? 1 : 0, status, sort })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [page, archived, status, sort]);

  function toggleSort(field: string) {
    const [cur, dir] = sort.split('|');
    setSort(`${field}|${cur === field && dir === 'DESC' ? 'ASC' : 'DESC'}`);
  }

  function reload() {
    setPage(1);
    // триггер перезагрузки: меняем страницу туда-обратно
    setLoading(true);
    api
      .orders({ page: 1, archived: archived ? 1 : 0, status, sort })
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {/* Topbar */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">MyCRM — заявки</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="text-sm text-indigo-600 hover:text-indigo-800 min-h-[44px] px-2"
            >
              Экспорт
            </button>
            <button
              onClick={() => { localStorage.removeItem('mycrm_token'); window.location.href = '/login'; }}
              className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
            >
              Выход
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        {/* Фильтры */}
        <div className="flex flex-wrap gap-2 items-center">
          <button
            onClick={() => { setArchived(false); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${!archived ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
          >
            Активные
          </button>
          <button
            onClick={() => { setArchived(true); setPage(1); }}
            className={`px-3 py-2 rounded-lg text-sm min-h-[44px] ${archived ? 'bg-indigo-600 text-white' : 'bg-white border border-slate-300 text-slate-700'}`}
          >
            Архив
          </button>
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm min-h-[44px] bg-white"
          >
            <option value="">Все статусы</option>
            <option value="1">В ожидании</option>
            <option value="2">Принят</option>
            <option value="3">Выполнено</option>
          </select>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        {loading && <div className="text-center py-10 text-slate-400">Загрузка...</div>}

        {data && !loading && (
          <>
            {/* Десктоп: таблица (ролевые колонки) */}
            <OrdersTable orders={data.data} role={role} sort={sort} onSort={toggleSort} onChanged={reload} />

            {/* Мобильный: карточки */}
            <div className="lg:hidden space-y-3">
              {data.data.map((o) => (
                <a
                  key={o.id}
                  href={`/orders/${o.id}`}
                  className="block bg-white rounded-xl shadow-sm border border-slate-200 p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-semibold text-slate-900">№{o.id} · {o.trc}</div>
                      <div className="text-sm text-slate-500">{formatDate(o.date)} · {o.brand}</div>
                    </div>
                    <StatusBadge status={o.status} archived={o.is_archived} />
                  </div>
                  <p className="text-sm text-slate-600 line-clamp-2">{o.type_work}</p>
                  {o.photo && o.photo !== '-' && (
                    <a href={o.photo.split(' ')[0]} target="_blank" rel="noreferrer" className="text-xs text-indigo-600 hover:underline">
                      📷 Фотопривязка
                    </a>
                  )}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500">{o.created_for?.fio || 'Монтажник не назначен'}</span>
                    <span className="font-semibold text-slate-900">{o.price} ₽</span>
                  </div>
                </a>
              ))}
            </div>

            {/* Пагинация */}
            {data.last_page > 1 && (
              <div className="flex items-center justify-center gap-2 py-4">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm min-h-[44px] disabled:opacity-40"
                >
                  ← Назад
                </button>
                <span className="text-sm text-slate-500 px-2">
                  {data.current_page} / {data.last_page} ({data.total} заявок)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(data.last_page, p + 1))}
                  disabled={page === data.last_page}
                  className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm min-h-[44px] disabled:opacity-40"
                >
                  Вперёд →
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showExport && <ExportModal role={role} onClose={() => setShowExport(false)} />}
    </main>
  );
}
