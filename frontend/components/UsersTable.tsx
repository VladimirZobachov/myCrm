'use client';

import { User } from '@/lib/api';

const ROLE_LABELS: Record<number, string> = {
  1: 'Администратор',
  2: 'Менеджер',
  3: 'Монтажник',
};

/**
 * Таблица пользователей (только для админа, 1:1 с legacy users()).
 */
export default function UsersTable({
  users,
  onEdit,
  onDelete,
}: {
  users: User[];
  onEdit: (id: number) => void;
  onDelete: (id: number) => void;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left text-slate-500">
            <th className="px-4 py-3 font-medium">Логин</th>
            <th className="px-4 py-3 font-medium">Email</th>
            <th className="px-4 py-3 font-medium">ФИО</th>
            <th className="px-4 py-3 font-medium">Роль</th>
            <th className="px-4 py-3 font-medium">Действия</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {users.map((u) => (
            <tr key={u.id} className="hover:bg-slate-50">
              <td className="px-4 py-3 font-medium text-slate-800">{u.login}</td>
              <td className="px-4 py-3 text-slate-600">{u.email}</td>
              <td className="px-4 py-3 text-slate-600">{u.fio || '—'}</td>
              <td className="px-4 py-3">
                <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-2.5 py-0.5 text-xs font-medium text-slate-700">
                  {ROLE_LABELS[u.type_user] ?? `Роль ${u.type_user}`}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <button
                  onClick={() => onEdit(u.id)}
                  className="text-xs text-indigo-600 hover:text-indigo-800 min-h-[36px] px-2 rounded hover:bg-indigo-50"
                >
                  Редактировать
                </button>
                <button
                  onClick={() => onDelete(u.id)}
                  className="text-xs text-red-600 hover:text-red-800 min-h-[36px] px-2 rounded hover:bg-red-50"
                >
                  Удалить
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
