'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import UsersTable, { ROLE_LABELS } from '@/components/UsersTable';
import UserFormModal from '@/components/UserFormModal';
import ConfirmModal from '@/components/ConfirmModal';
import UserRowActions from '@/components/UserRowActions';
import { api, User } from '@/lib/api';

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<User | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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

  async function doDelete(id: number) {
    try {
      await api.delete(`/users/${id}`);
      setDeleteId(null);
      load();
    } catch (e) {
      setDeleteId(null);
      setError(e instanceof Error ? e.message : 'Ошибка удаления');
    }
  }

  return (
    <main className="min-h-dvh bg-slate-50">
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
          <>
            {/* Десктоп: таблица */}
            <UsersTable
              users={users}
              onEdit={(id) => {
                const u = users.find((x) => x.id === id);
                if (u) { setEditing(u); setShowForm(true); }
              }}
              onDelete={setDeleteId}
            />

            {/* Мобильный: карточки (по табличному макету table users 320) */}
            <div className="lg:hidden space-y-3">
              {users.length === 0 && (
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 text-center text-slate-500 text-sm">
                  Пользователей не найдено
                </div>
              )}
              {users.map((u) => (
                <div key={u.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100">
                    <span className="font-semibold text-slate-900">{u.login}</span>
                    <div className="flex items-center gap-1">
                      <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 whitespace-nowrap">
                        {ROLE_LABELS[u.type_user] ?? `Роль ${u.type_user}`}
                      </span>
                      <UserRowActions
                        onEdit={() => { setEditing(u); setShowForm(true); }}
                        onDelete={() => setDeleteId(u.id)}
                      />
                    </div>
                  </div>

                  <dl className="divide-y divide-slate-100">
                    <div className="py-2 text-sm">
                      <dt className="text-xs text-slate-400">Email:</dt>
                      <dd className="text-slate-700">{u.email}</dd>
                    </div>
                    <div className="py-2 text-sm">
                      <dt className="text-xs text-slate-400">ФИО:</dt>
                      <dd className="text-slate-700">{u.fio || '—'}</dd>
                    </div>
                  </dl>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {showForm && (
        <UserFormModal
          user={editing}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); load(); }}
        />
      )}

      {deleteId !== null && (
        <ConfirmModal
          title="Удалить пользователя?"
          message="Внимание! После удаления человека не станет в системе!"
          confirmLabel="Удалить"
          onCancel={() => setDeleteId(null)}
          onConfirm={() => doDelete(deleteId)}
        />
      )}
    </main>
  );
}
