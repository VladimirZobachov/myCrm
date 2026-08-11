'use client';

import { useState } from 'react';
import { User } from '@/lib/api';

const ROLE_LABELS: Record<number, string> = {
  1: 'Администратор',
  2: 'Менеджер',
  3: 'Монтажник',
};

/**
 * Личный кабинет (legacy myCabinet): смена email/ФИО/пароля.
 * «Пусто = не менять» для пароля.
 */
export default function ProfileForm({ user, onSaved }: { user: User; onSaved: () => void }) {
  const [email, setEmail] = useState(user.email);
  const [fio, setFio] = useState(user.fio || '');
  const [passwd, setPasswd] = useState('');
  const [passwd2, setPasswd2] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (passwd && passwd !== passwd2) {
      setError('Пароли не совпадают');
      return;
    }
    if (passwd && passwd.length < 4) {
      setError('Пароль должен быть не короче 4 символов');
      return;
    }

    setLoading(true);
    try {
      const payload: Record<string, string> = { email, fio };
      if (passwd) payload.passwd = passwd;

      const res = await fetch('/api/bff/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body.message || body.error || 'Ошибка сохранения');
      }
      setSuccess(true);
      setPasswd('');
      setPasswd2('');
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
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
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
          Профиль обновлён
        </div>
      )}

      {/* Логин и роль — неизменяемы */}
      <div className="flex gap-4 text-sm">
        <div className="flex-1">
          <div className={labelCls}>Логин</div>
          <div className="text-slate-900 font-medium">{user.login}</div>
        </div>
        <div className="flex-1">
          <div className={labelCls}>Роль</div>
          <div className="text-slate-900 font-medium">{ROLE_LABELS[user.type_user] ?? '—'}</div>
        </div>
      </div>

      <div>
        <label htmlFor="pf-email" className={labelCls}>E-mail *</label>
        <input
          id="pf-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputCls}
          required
        />
      </div>

      <div>
        <label htmlFor="pf-fio" className={labelCls}>ФИО</label>
        <input
          id="pf-fio"
          type="text"
          value={fio}
          onChange={(e) => setFio(e.target.value)}
          className={inputCls}
        />
      </div>

      <div className="border-t border-slate-100 pt-4">
        <div className="text-sm font-medium text-slate-700 mb-1">Смена пароля</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="pf-passwd" className={labelCls}>Новый пароль</label>
            <input
              id="pf-passwd"
              type="password"
              value={passwd}
              onChange={(e) => setPasswd(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
          <div>
            <label htmlFor="pf-passwd2" className={labelCls}>Повторите пароль</label>
            <input
              id="pf-passwd2"
              type="password"
              value={passwd2}
              onChange={(e) => setPasswd2(e.target.value)}
              className={inputCls}
              autoComplete="new-password"
            />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-1">Оставьте пустым, чтобы не менять пароль</p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Сохранение...' : 'Сохранить'}
      </button>
    </form>
  );
}
