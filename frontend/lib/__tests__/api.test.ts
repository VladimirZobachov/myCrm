import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { api, getToken, setToken, clearToken } from '@/lib/api';

// Fake XMLHttpRequest — uploadPhoto использует XHR (не fetch), чтобы иметь
// доступ к upload.onprogress для реального прогресс-бара.
class FakeXHR {
  static instances: FakeXHR[] = [];
  upload: { onprogress: ((e: ProgressEvent) => void) | null } = { onprogress: null };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  onabort: (() => void) | null = null;
  status = 0;
  responseText = '';
  withCredentials = false;
  open = vi.fn();
  send = vi.fn();

  constructor() {
    FakeXHR.instances.push(this);
  }
}

describe('api client (BFF, httpOnly cookie)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('getToken всегда null (JWT в httpOnly cookie)', () => {
    setToken('abc123');
    expect(getToken()).toBeNull();
    clearToken();
  });

  it('orders идёт через /api/bff/orders с credentials:include', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, current_page: 1, last_page: 1, per_page: 50 }),
    });

    await api.orders({ page: 2, archived: 1, sort: 'date|DESC' });

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('/api/bff/orders?page=2&archived=1&sort=date%7CDESC');
    expect((opts as RequestInit).credentials).toBe('include');
    // Никакого Authorization из JS — токен только в cookie
    expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('401 без редиректа на /login (уже на login)', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    await expect(api.orders({})).rejects.toThrow('Не авторизован');
  });

  it('ошибка API → Error с message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Поле обязательно' }),
    });

    await expect(api.orders({})).rejects.toThrow('Поле обязательно');
  });

  it('обрыв сети (fetch reject TypeError) → «Нет соединения с сервером»', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(api.orders({})).rejects.toThrow('Нет соединения с сервером. Проверьте интернет');
  });

  it('post шлёт JSON body', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: async () => ({ id: 1 }),
    });

    await api.createOrder({ type_work: 'Монтаж', price: '1000' });

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('/api/bff/orders');
    expect((opts as RequestInit).method).toBe('POST');
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ type_work: 'Монтаж', price: '1000' });
  });

  describe('uploadPhoto (XHR с прогрессом)', () => {
    const OriginalXHR = global.XMLHttpRequest;

    beforeEach(() => {
      FakeXHR.instances = [];
      global.XMLHttpRequest = FakeXHR as unknown as typeof XMLHttpRequest;
    });

    afterEach(() => {
      global.XMLHttpRequest = OriginalXHR;
    });

    it('шлёт FormData через XHR и репортит прогресс через onProgress', async () => {
      const file = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
      const onProgress = vi.fn();

      const promise = api.uploadPhoto(5, file, onProgress);
      const xhr = FakeXHR.instances[0];
      expect(xhr.send).toHaveBeenCalledWith(expect.any(FormData));
      expect(xhr.withCredentials).toBe(true);

      xhr.upload.onprogress?.({ lengthComputable: true, loaded: 50, total: 100 } as ProgressEvent);
      expect(onProgress).toHaveBeenCalledWith(50);

      xhr.status = 201;
      xhr.responseText = JSON.stringify({ id: 1, url: 'https://example.test/p1.jpg' });
      xhr.onload?.();

      await expect(promise).resolves.toEqual({ id: 1, url: 'https://example.test/p1.jpg' });
    });

    it('отклоняет промис с текстом ошибки сервера', async () => {
      const file = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = api.uploadPhoto(5, file);
      const xhr = FakeXHR.instances[0];

      xhr.status = 422;
      xhr.responseText = JSON.stringify({ message: 'Файл слишком большой' });
      xhr.onload?.();

      await expect(promise).rejects.toThrow('Файл слишком большой');
    });

    it('отклоняет промис при сетевой ошибке (обрыв соединения)', async () => {
      const file = new File(['a'], 'photo.jpg', { type: 'image/jpeg' });
      const promise = api.uploadPhoto(5, file);
      const xhr = FakeXHR.instances[0];

      xhr.onerror?.();

      await expect(promise).rejects.toThrow();
    });
  });
});
