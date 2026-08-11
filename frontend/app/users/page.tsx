'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UsersTable from '@/components/UsersTable';
import UserFormModal from '@/components/UserFormModal';
import { api, User } from '@/lib/api';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);

  function load() {
    setLoading(true);
    setError('');
    api
      .get<{ data: User[] }>('/users')
      .then((res) => setUsers(res.data))
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

  async function handleDelete(id: number) {
    if (!window.confirm('Удалить пользователя?')) return;
    try {
      await api.delete(`/users/${id}`);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-lg text-slate-900">Пользователи</h1>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setEditing(null); setShowForm(true); }}
              className="text-sm bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg px-3 py-2 min-h-[44px]"
            >
              + Добавить
            </button>
            <button
              onClick={() => router.push('/')}
              className="text-sm text-slate-500 hover:text-slate-700 min-h-[44px] px-2"
            >
              ← Заявки
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-4">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        {loading ? (
          <div className="text-center py-10 text-slate-400">Загрузка...</div>
        ) : (
          <UsersTable
            users={users}
            onEdit={(id) => {
              const u = users.find((x) => x.id === id);
              if (u) { setEditing(u); setShowForm(true); }
            }}
            onDelete={handleDelete}
          />
        )}
      </div>

      {showForm && (
        <UserFormModal
          user={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}
    </main>
  );
}
