// API-клиент для MyCRM backend (Laravel API)
// Все запросы идут через BFF-прокси Next.js (app/api/bff/[...path]).
// JWT живёт в httpOnly cookie (ставится /api/auth/login) — JS его не видит (XSS-safe).
const API_URL = '/api/bff';

export interface User {
  id: number;
  login: string;
  email: string;
  fio: string;
  type_user: number;
}

export interface Photo {
  id: number;
  url: string;
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
  photos?: Photo[];
}

export interface OrderInput {
  trc?: string;
  trc_other?: string | null;
  date?: string;
  type_work?: string;
  brand?: string;
  where_print?: string;
  where_other?: string | null;
  photo?: string;
  price?: string;
  price_admin?: string;
  importance?: string;
  importance_other?: string;
  created_for?: string | number | null;
  status?: number;
  is_archived?: number;
}

export interface Paginated<T> {
  data: T[];
  total: number;
  current_page: number;
  last_page: number;
  per_page: number;
}

// v2: JWT в httpOnly cookie (BFF). localStorage больше НЕ используется.
const TOKEN_KEY = 'mycrm_token'; // сохранён для совместимости старых сессий

export function getToken(): string | null {
  return null; // токен недоступен JS — в httpOnly cookie
}

export function setToken(_token: string): void {
  // no-op: токен ставится сервером через Set-Cookie
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (res.status === 401) {
    if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
      window.location.href = '/login';
    }
    throw new Error('Не авторизован');
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const raw = body.message || body.error || `Ошибка ${res.status}`;
    // Не светить служебную информацию (SQL, стектрейсы, имена БД/хостов)
    const dangerous = /SQLSTATE|SQL\[|exception|Trace|stack|Connection:|Database:|Host:/i.test(String(raw));
    throw new Error(dangerous ? 'Ошибка сервера. Попробуйте позже' : raw);
  }

  return res.json();
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers, credentials: 'include' });
  } catch (e) {
    // fetch кидает TypeError при обрыве сети/недоступности сервера (не HTTP-ошибка)
    if (e instanceof TypeError) {
      throw new Error('Нет соединения с сервером. Проверьте интернет');
    }
    throw e;
  }
  return handleResponse<T>(res);
}

// Загрузка файла — FormData/multipart, а НЕ JSON. Content-Type с boundary
// браузер выставляет сам, поэтому здесь его нельзя задавать вручную.
// XHR (а не fetch) — только у upload.onprogress есть реальный прогресс отправки.
function uploadFile<T>(
  path: string,
  formData: FormData,
  onProgress?: (percent: number) => void
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${API_URL}${path}`);
    xhr.withCredentials = true;

    xhr.upload.onprogress = (e) => {
      if (onProgress && e.lengthComputable) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      let body: Record<string, unknown> = {};
      try {
        body = xhr.responseText ? JSON.parse(xhr.responseText) : {};
      } catch {
        body = {};
      }

      if (xhr.status === 401) {
        if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
          window.location.href = '/login';
        }
        reject(new Error('Не авторизован'));
        return;
      }

      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(body as T);
        return;
      }

      const raw = body.message || body.error || `Ошибка ${xhr.status}`;
      const dangerous = /SQLSTATE|SQL\[|exception|Trace|stack|Connection:|Database:|Host:/i.test(String(raw));
      reject(new Error(dangerous ? 'Ошибка сервера. Попробуйте позже' : String(raw)));
    };

    xhr.onerror = () => reject(new Error('Ошибка сети. Проверьте подключение'));
    xhr.onabort = () => reject(new Error('Загрузка отменена'));

    xhr.send(formData);
  });
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
  createOrder: (data: OrderInput) => request<Order>('/orders', { method: 'POST', body: JSON.stringify(data) }),
  updateOrder: (id: number, data: OrderInput) =>
    request<Order>(`/orders/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  updateStatus: (id: number, status: number) =>
    request<Order>(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  updateComment: (id: number, comment: string, forUser?: number) =>
    request<Order>(`/orders/${id}/comment`, { method: 'PATCH', body: JSON.stringify({ comment, ...(forUser !== undefined ? { for: forUser } : {}) }) }),
  archive: (id: number, archived: boolean) =>
    request<Order>(`/orders/${id}/archive`, { method: 'PATCH', body: JSON.stringify({ archived }) }),
  deleteOrder: (id: number) => request<{ message: string }>(`/orders/${id}`, { method: 'DELETE' }),

  // Photos
  uploadPhoto: (orderId: number, file: File, onProgress?: (percent: number) => void) => {
    const formData = new FormData();
    formData.append('photo', file);
    return uploadFile<Photo>(`/orders/${orderId}/photos`, formData, onProgress);
  },
  deletePhoto: (photoId: number) =>
    request<{ message: string }>(`/orders/photos/${photoId}`, { method: 'DELETE' }),
};
