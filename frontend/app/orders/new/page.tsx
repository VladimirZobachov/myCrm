'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import OrderForm from '@/components/OrderForm';
import { api, User } from '@/lib/api';

export default function NewOrderPage() {
  const router = useRouter();
  const [role, setRole] = useState<number>(1);
  const [mounters, setMounters] = useState<{ id: number; fio: string }[]>([]);

  useEffect(() => {
    api
      .me()
      .then((me) => setRole(me.user.type_user))
      .catch(() => {});
    // Список монтажников для админа
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
  }, []);

  return (
    <main className="min-h-dvh bg-slate-100 py-8 px-4">
      <div className="max-w-3xl mx-auto rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-gradient-to-b from-slate-100 to-white px-6 py-4">
          <h1 className="text-xl font-semibold text-blue-600">Новый заказ</h1>
        </div>
        <div className="p-6">
          <OrderForm
            role={role}
            mounters={mounters}
            onSaved={() => router.push('/')}
            onCancel={() => router.push('/')}
          />
        </div>
      </div>
    </main>
  );
}
