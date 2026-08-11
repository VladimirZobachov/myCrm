// API-клиент для MyCRM backend (Laravel API)
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface User {
  id: number;
  login: string;
  email: string;
  fio: string;
  type_user: number;
}

export interface Order {
  id: number;
  date_create: string;
  date: string;
  trc: string;
  trc_other: string | null;
  type_work: string;
  brand: string;
  where_print: string;
  where_other: string | null;
  photo: string;
  price: string;
  price_admin: string;
  importance: string;
  importance_other: string;
  created_by: User | null;
  created_for: User | null;
  comments: string | null;
  comment_manager: string;
  status: number;
  is_archived: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

// В v1 JWT храним в localStorage (для httpOnly-cookie нужен BFF — Итерация 7)
const TOKEN_KEY = 'mycrm_token';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    clearToken();
    if (typeof window !== 'undefined') window.location.href = '/login';
    throw new Error('Не авторизован');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.message || body.error || `Ошибка ${res.status}`);
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'POST', body: JSON.stringify(body) }),
  patch: <T>(path: string, body: unknown) =>
    request<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),

  // Auth
  login: (login: string, passwd: string) =>
    request<{ access_token: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ login, passwd }),
    }),
  me: () => request<{ user: User }>('/auth/me'),

  // Orders
  orders: (params: Record<string, string | number | boolean> = {}) => {
    const qs = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, String(v)])
    ).toString();
    return request<Paginated<Order>>(`/orders?${qs}`);
  },
  order: (id: number) => request<Order>(`/orders/${id}`),
  createOrder: (data: Partial<Order>) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id: number, data: Partial<Order>) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: number) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateComment: (id: number, comment: string) =>
    request<Order>(`/orders/${id}/comment`, { method: 'PATCH', body: JSON.stringify({ comment }) }),
  archive: (id: number, archived: boolean) =>
    request<Order>(`/orders/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
};
