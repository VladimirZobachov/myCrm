'use client';

import { MigrationMetrics as MigrationMetricsData } from '@/lib/api';
import { ROLE_LABELS } from '@/components/UsersTable';

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
      <div className="text-xs text-slate-400">{label}</div>
      <div className="text-2xl font-bold text-slate-900 tabular-nums">{value}</div>
    </div>
  );
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full h-2 rounded-full bg-slate-100 overflow-hidden"
    >
      <div
        className="h-full rounded-full bg-blue-600 transition-all"
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  );
}

/**
 * Карточки статистики + таблица по ролям с прогресс-баром (задача #64).
 */
export default function MigrationMetrics({ data }: { data: MigrationMetricsData }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <StatCard label="Всего" value={String(data.total)} />
        <StatCard label="Мигрировано" value={String(data.migrated)} />
        <StatCard label="Процент" value={`${data.percent}%`} />
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200">
            <tr className="text-left text-slate-500">
              <th className="px-4 py-3 font-medium">Роль</th>
              <th className="px-4 py-3 font-medium">Всего</th>
              <th className="px-4 py-3 font-medium">Мигрировано</th>
              <th className="px-4 py-3 font-medium">Прогресс</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.by_role.map((r) => (
              <tr key={r.role}>
                <td className="px-4 py-3 font-medium text-slate-800">
                  {ROLE_LABELS[r.role] ?? `Роль ${r.role}`}
                </td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{r.total}</td>
                <td className="px-4 py-3 text-slate-600 tabular-nums">{r.migrated}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-32">
                      <ProgressBar percent={r.percent} />
                    </div>
                    <span className="text-xs text-slate-500 tabular-nums">{r.percent}%</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
