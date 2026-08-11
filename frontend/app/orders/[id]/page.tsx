'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OrderDetails from '@/components/OrderDetails';
import { api, Order } from '@/lib/api';

export default function OrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api
      .order(Number(id))
      .then(setOrder)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
  }, [id, router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Карточка заявки</h1>
          <div className="flex items-center gap-2">
            <a
              href={`/orders/${id}/edit`}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-3 py-2 min-h-[44px] flex items-center"
            >
              Редактировать
            </a>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
            >
              ← Назад
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Загрузка...</div>
        ) : (
          order && <OrderDetails order={order} />
        )}
      </div>
    </main>
  );
}
