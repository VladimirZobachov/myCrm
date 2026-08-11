'use client';

import { useState } from 'react';

/**
 * Регистрация (legacy register()): логин/email/ФИО/пароль/роль.
 * Роли: только менеджер (2) и монтажник (3) — администратор недоступен.
 * Решение по модерации: v1 — регистрация сразу активна (как в legacy),
 * админ-роль создаёт только админ через /users.
 */
export default function RegisterForm({ onRegistered }: { onRegistered: () => void }) {
  const [form, setForm] = useState({
    login: '',
    email: '',
    fio: '',
    passwd: '',
    type_user: '3', // по умолчанию монтажник (legacy)
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/bff/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, type_user: Number(form.type_user) }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || 'Ошибка регистрации');
      }
      onRegistered();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div>
        <label htmlFor="reg-login" className={labelCls}>Логин *</label>
        <input
          id="reg-login"
          type="text"
          value={form.login}
          onChange={(e) => setForm({ ...form, login: e.target.value })}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label htmlFor="reg-email" className={labelCls}>E-mail *</label>
        <input
          id="reg-email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label htmlFor="reg-fio" className={labelCls}>ФИО</label>
        <input
          id="reg-fio"
          type="text"
          value={form.fio}
          onChange={(e) => setForm({ ...form, fio: e.target.value })}
          className={inputCls}
        />
      </div>

      <div>
        <label htmlFor="reg-passwd" className={labelCls}>Пароль *</label>
        <input
          id="reg-passwd"
          type="password"
          value={form.passwd}
          onChange={(e) => setForm({ ...form, passwd: e.target.value })}
          className={inputCls}
          required
          minLength={4}
        />
      </div>

      <div>
        <label htmlFor="reg-type" className={labelCls}>Роль *</label>
        <select
          id="reg-type"
          value={form.type_user}
          onChange={(e) => setForm({ ...form, type_user: e.target.value })}
          className={inputCls}
          required
        >
          <option value="3">Монтажник</option>
          <option value="2">Менеджер</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Регистрация...' : 'Зарегистрироваться'}
      </button>
    </form>
  );
}
