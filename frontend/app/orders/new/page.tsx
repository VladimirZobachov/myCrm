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
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Новая заявка</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
          >
            ← Назад
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
          <OrderForm
            role={role}
            mounters={mounters}
            onSaved={() => router.push('/')}
          />
        </div>
      </div>
    </main>
  );
}
