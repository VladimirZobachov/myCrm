// BFF (Backend-For-Frontend): серверные функции для работы с Laravel API.
// JWT живёт в httpOnly cookie — недоступен JS, XSS не украдёт токен.
// Эти функции вызываются ТОЛЬКО из Next.js API routes (app/api/*/route.ts).

// Важно: 127.0.0.1 вместо localhost — Node резолвит localhost в ::1 (IPv6),
// а Laravel слушает только IPv4 (ECONNREFUSED ::1:8000).
export const BACKEND_API = process.env.BACKEND_API_URL || 'http://127.0.0.1:8000/api';
export const AUTH_COOKIE = 'mycrm_token';

// Разобрать cookie-строку, вернуть значение токена
export function parseCookies(cookieHeader: string | undefined | null): string | null {
  if (!cookieHeader) return null;
  const match = cookieHeader.split(';').map((p) => p.trim()).find((p) => p.startsWith(`${AUTH_COOKIE}=`));
  return match ? match.slice(AUTH_COOKIE.length + 1) : null;
}

// POST /auth/login → { access_token, user }
export async function bffLogin(login: string, passwd: string) {
  const res = await fetch(`${BACKEND_API}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login, passwd }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(body.error || body.message || 'Ошибка входа');
  }
  return body as { access_token: string; user: { id: number; login: string; type_user: number; fio: string; email: string } };
}

// GET /auth/me с Bearer из cookie
export async function bffMe(cookieHeader: string | null) {
  const token = parseCookies(cookieHeader);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_API}/auth/me`, { headers });
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    throw new Error('Не авторизован');
  }
  if (!res.ok) {
    throw new Error(body.error || body.message || 'Ошибка');
  }
  return body as { user: { id: number; login: string; type_user: number; fio: string; email: string } };
}

// POST /auth/logout с Bearer из cookie
export async function bffLogout(cookieHeader: string | null) {
  const token = parseCookies(cookieHeader);
  const headers: Record<string, string> = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${BACKEND_API}/auth/logout`, {
    method: 'POST',
    headers,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || body.message || 'Ошибка выхода');
  }
  return res.json();
}
