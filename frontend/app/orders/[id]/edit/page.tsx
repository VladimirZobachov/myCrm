'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OrderForm from '@/components/OrderForm';
import { api, Order, User } from '@/lib/api';

export default function EditOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [id, setId] = useState<string>('');
  const [role, setRole] = useState<number>(1);
  const [order, setOrder] = useState<Order | null>(null);
  const [mounters, setMounters] = useState<{ id: number; fio: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    api
      .me()
      .then((me) => setRole(me.user.type_user))
      .catch(() => {});
    api
      .order(Number(id))
      .then(setOrder)
      .catch(() => router.push('/'))
      .finally(() => setLoading(false));
    api
      .get<{ data: User[] }>('/users')
      .then((res) =>
        setMounters(
          res.data
            .filter((u) => u.type_user === 3)
            .map((u) => ({ id: u.id, fio: u.fio || u.login }))
        )
      )
      .catch(() => {});
  }, [id, router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Заявка №{id || '...'}</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
          >
            ← Назад
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Загрузка...</div>
        ) : (
          order && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <OrderForm
                role={role}
                order={order}
                mounters={mounters}
                onSaved={() => router.push('/')}
              />
            </div>
          )
        )}
      </div>
    </main>
  );
}
