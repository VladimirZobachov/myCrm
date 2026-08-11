import { describe, it, expect, beforeEach, vi } from 'vitest';
import { api, getToken, setToken, clearToken } from '@/lib/api';

describe('api client (JWT)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('setToken/getToken/clearToken работают с localStorage', () => {
    setToken('abc123');
    expect(getToken()).toBe('abc123');
    clearToken();
    expect(getToken()).toBeNull();
  });

  it('login отправляет POST /auth/login с логином и паролем', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'tok', user: { id: 1 } }),
    });

    await api.login('admin', 'secret');

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/login'),
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ login: 'admin', passwd: 'secret' }),
      })
    );
  });

  it('orders передаёт параметры в query string', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ data: [], total: 0, current_page: 1, last_page: 1, per_page: 50 }),
    });

    setToken('tok123');
    await api.orders({ page: 2, archived: 1, sort: 'date|DESC' });

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders?');
    expect(String(url)).toContain('page=2');
    expect(String(url)).toContain('archived=1');
    expect(String(url)).toContain('sort=date%7CDESC');
    expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer tok123');
  });

  it('401 очищает токен', async () => {
    setToken('expired');
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({}),
    });

    await expect(api.orders({})).rejects.toThrow('Не авторизован');
    expect(getToken()).toBeNull();
  });

  it('ошибка API → Error с message', async () => {
    (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Поле обязательно' }),
    });

    await expect(api.orders({})).rejects.toThrow('Поле обязательно');
  });
});
