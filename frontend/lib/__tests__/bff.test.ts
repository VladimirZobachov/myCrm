import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bffLogin, bffMe, bffLogout, parseCookies } from '@/lib/bff';

const BACKEND = 'http://localhost:8000/api';

describe('BFF auth (#39)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  describe('bffLogin', () => {
    it('проксирует POST /auth/login к бэкенду', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ access_token: 'tok123', user: { id: 1 } }),
      });

      const result = await bffLogin('admin', 'secret');

      expect(global.fetch).toHaveBeenCalledWith(
        `${BACKEND}/auth/login`,
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ login: 'admin', passwd: 'secret' }),
        })
      );
      expect(result.access_token).toBe('tok123');
    });

    it('возвращает ошибку при 401', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ error: 'Неверный логин или пароль' }),
      });

      await expect(bffLogin('admin', 'wrong')).rejects.toThrow('Неверный логин или пароль');
    });
  });

  describe('bffMe', () => {
    it('передаёт Cookie из запроса', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ user: { id: 1, login: 'admin' } }),
      });

      await bffMe('mycrm_token=abc');

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(String(url)).toContain('/auth/me');
      expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    });

    it('без cookie — не шлёт Authorization', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({}),
      });

      await expect(bffMe('')).rejects.toThrow('Не авторизован');
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect((opts.headers as Record<string, string>).Authorization).toBeUndefined();
    });
  });

  describe('bffLogout', () => {
    it('вызывает POST /auth/logout с токеном из cookie', async () => {
      (global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ message: 'ok' }),
      });

      await bffLogout('mycrm_token=abc');

      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(String(url)).toContain('/auth/logout');
      expect((opts.headers as Record<string, string>).Authorization).toBe('Bearer abc');
    });
  });

  describe('parseCookies', () => {
    it('разбирает cookie-строку', () => {
      expect(parseCookies('a=1; mycrm_token=xyz; b=2')).toBe('xyz');
    });

    it('без токена — null', () => {
      expect(parseCookies('a=1; b=2')).toBeNull();
    });

    it('пустая строка — null', () => {
      expect(parseCookies('')).toBeNull();
    });
  });
});
