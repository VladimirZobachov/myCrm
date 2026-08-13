'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import MigrationMetrics from '@/components/MigrationMetrics';
import { api, MigrationMetrics as MigrationMetricsData } from '@/lib/api';

export default function MigrationPage() {
  const router = useRouter();
  const [data, setData] = useState<MigrationMetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  function load() {
    setLoading(true);
    setError('');
    api
      .migrationMetrics()
      .then(setData)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    // Только админ (type_user=1), иначе редирект
    api
      .me()
      .then((me) => {
        if (me.user.type_user !== 1) {
          router.replace('/');
          return;
        }
        load();
      })
      .catch(() => router.replace('/login'));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <main className="min-h-dvh bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Миграция на v2</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
          >
            ← Заявки
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-10 text-slate-400">Загрузка...</div>
        ) : (
          data && <MigrationMetrics data={data} />
        )}
      </div>
    </main>
  );
}
