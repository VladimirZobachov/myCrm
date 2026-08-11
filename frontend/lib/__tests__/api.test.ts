import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, getToken, setToken, clearToken } from '@/lib/api';

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
});
