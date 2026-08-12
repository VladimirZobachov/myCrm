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
    <main className="min-h-dvh bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
          <h1 className="text-xl font-semibold text-blue-600">Редактировать заказ</h1>
        </div>
        <div className="p-6">
          {loading ? (
            <div className="text-center py-10 text-slate-400">Загрузка...</div>
          ) : (
            order && (
              <OrderForm
                role={role}
                order={order}
                mounters={mounters}
                onSaved={() => router.push('/')}
                onCancel={() => router.push('/')}
              />
            )
          )}
        </div>
      </div>
    </main>
  );
}
