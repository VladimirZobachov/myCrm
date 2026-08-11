'use client';

import { useState } from 'react';
import { api, Order } from '@/lib/api';

// Экспорт в CSV (клиентский, без серверных зависимостей)
function exportCsv(orders: Order[], role: number) {
  const headers = ['№', 'Дата монтажа', 'ТРЦ', 'Вид работ', 'Бренд', 'Ст-ть'];
  const rows = orders.map((o) => [
    o.id,
    o.date,
    o.trc,
    o.type_work,
    o.brand,
    o.price,
  ]);

  const csv = [headers, ...rows]
    .map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';'))
    .join('\r\n');

  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `mycrm-orders-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportModal({ role, onClose }: { role: number; onClose: () => void }) {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleExport() {
    setLoading(true);
    setError('');
    try {
      // Тянем все страницы (по 50), фильтруем по датам на клиенте
      let all: Order[] = [];
      let page = 1;
      let lastPage = 1;
      do {
        const res = await api.orders({ page, per_page: 50, archived: 1 });
        all = all.concat(res.data);
        lastPage = res.last_page;
        page++;
      } while (page <= lastPage);

      if (from) all = all.filter((o) => o.date >= from);
      if (to) all = all.filter((o) => o.date <= to);

      exportCsv(all, role);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка экспорта');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Экспорт заказов</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl min-h-[44px] px-2">×</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Дата с</label>
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700">Дата по</label>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <button
          onClick={handleExport}
          disabled={loading}
          className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px] disabled:opacity-50 transition-colors"
        >
          {loading ? 'Экспортирую...' : 'Скачать CSV'}
        </button>
      </div>
    </div>
  );
}
