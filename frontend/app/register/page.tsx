'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import RegisterForm from '@/components/RegisterForm';

export default function RegisterPage() {
  const router = useRouter();
  const [success, setSuccess] = useState(false);

  return (
    <main className="min-h-dvh flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm bg-white rounded-xl shadow-md p-8 space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Регистрация</h1>
        <p className="text-sm text-slate-500">
          Создайте аккаунт менеджера или монтажника. После регистрации вы сразу войдёте в систему.
        </p>

        {success ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 text-green-700 rounded-lg p-3 text-sm">
              Аккаунт создан! Вы вошли в систему.
            </div>
            <button
              onClick={() => router.push('/')}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px]"
            >
              Перейти к заявкам →
            </button>
          </div>
        ) : (
          <RegisterForm onRegistered={() => setSuccess(true)} />
        )}

        <div className="text-center">
          <a href="/login" className="text-sm text-indigo-600 hover:underline">
            Уже есть аккаунт? Войти
          </a>
        </div>
      </div>
    </main>
  );
}
