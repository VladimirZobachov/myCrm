import { NextRequest, NextResponse } from 'next/server';
import { bffLogout, AUTH_COOKIE } from '@/lib/bff';

// POST /api/auth/logout — прокси к Laravel + очистка cookie
export async function POST(req: NextRequest) {
  try {
    const cookieHeader = req.headers.get('cookie');
    await bffLogout(cookieHeader);
  } catch {
    // Даже если бэкенд вернул ошибку — cookie очищаем
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(AUTH_COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
