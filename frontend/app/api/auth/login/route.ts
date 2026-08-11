import { NextRequest, NextResponse } from 'next/server';
import { bffLogin, AUTH_COOKIE } from '@/lib/bff';

// POST /api/auth/login — прокси к Laravel, ставит httpOnly cookie
export async function POST(req: NextRequest) {
  try {
    const { login, passwd } = await req.json();
    if (!login || !passwd) {
      return NextResponse.json({ error: 'Логин и пароль обязательны' }, { status: 400 });
    }

    const data = await bffLogin(login, passwd);

    const res = NextResponse.json({ user: data.user });
    res.cookies.set(AUTH_COOKIE, data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60, // 1 час (совпадает с JWT TTL)
    });
    return res;
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Ошибка входа';
    return NextResponse.json({ error: message }, { status: 401 });
  }
}
