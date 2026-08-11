'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ProfileForm from '@/components/ProfileForm';
import { api, User } from '@/lib/api';

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .me()
      .then((me) => setUser(me.user))
      .catch(() => router.replace('/login'))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Личный кабинет</h1>
          <button
            onClick={() => router.push('/')}
            className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
          >
            ← Заявки
          </button>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-10 text-slate-400">Загрузка...</div>
        ) : (
          user && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
              <ProfileForm user={user} onSaved={() => {}} />
            </div>
          )
        )}
      </div>
    </main>
  );
}
