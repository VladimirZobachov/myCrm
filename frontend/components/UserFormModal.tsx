'use client';

import { useState } from 'react';
import { User, api } from '@/lib/api';
import Modal from '@/components/Modal';

/**
 * Модалка добавления/редактирования пользователя (только админ).
 * Режим редактирования: пароль не требуется («пусто = не менять»).
 */
export default function UserFormModal({
  user,
  onClose,
  onSaved,
}: {
  user?: User | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = Boolean(user);
  const [form, setForm] = useState({
    login: user?.login ?? '',
    email: user?.email ?? '',
    fio: user?.fio ?? '',
    passwd: '',
    type_user: user?.type_user ? String(user.type_user) : '2',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isEdit && user) {
        const payload: Record<string, string> = {
          login: form.login,
          email: form.email,
          fio: form.fio,
          type_user: form.type_user,
        };
        if (form.passwd) payload.passwd = form.passwd;
        await api.patch(`/users/${user.id}`, payload);
      } else {
        await api.post('/users', {
          login: form.login,
          email: form.email,
          fio: form.fio,
          passwd: form.passwd,
          type_user: Number(form.type_user),
        });
      }
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <Modal onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">
            {isEdit ? 'Редактировать пользователя' : 'Новый пользователь'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl min-h-[44px] px-2">×</button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="user-login" className={labelCls}>Логин *</label>
            <input
              id="user-login"
              type="text"
              value={form.login}
              onChange={(e) => setForm({ ...form, login: e.target.value })}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label htmlFor="user-email" className={labelCls}>Email *</label>
            <input
              id="user-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputCls}
              required
            />
          </div>

          <div>
            <label htmlFor="user-fio" className={labelCls}>ФИО</label>
            <input
              id="user-fio"
              type="text"
              value={form.fio}
              onChange={(e) => setForm({ ...form, fio: e.target.value })}
              className={inputCls}
            />
          </div>

          <div>
            <label htmlFor="user-passwd" className={labelCls}>
              {isEdit ? 'Пароль (оставьте пустым, чтобы не менять)' : 'Пароль *'}
            </label>
            <input
              id="user-passwd"
              type="password"
              value={form.passwd}
              onChange={(e) => setForm({ ...form, passwd: e.target.value })}
              className={inputCls}
              required={!isEdit}
              minLength={4}
            />
          </div>

          <div>
            <label htmlFor="user-type" className={labelCls}>Роль *</label>
            <select
              id="user-type"
              value={form.type_user}
              onChange={(e) => setForm({ ...form, type_user: e.target.value })}
              className={inputCls}
              required
            >
              <option value="2">Менеджер</option>
              <option value="3">Монтажник</option>
              <option value="1">Администратор</option>
            </select>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-slate-300 text-slate-700 font-medium rounded-lg py-2.5 min-h-[44px] hover:bg-slate-50"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px] disabled:opacity-50"
            >
              {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
