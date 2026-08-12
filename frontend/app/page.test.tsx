import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrdersPage from './page';

function mockOrdersFetch(ordersImpl: () => Promise<unknown>) {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: unknown) => {
    if (String(url).includes('/orders')) return ordersImpl();
    // /auth/me — не относится к загрузке заявок, ошибка тут проглатывается компонентом
    return Promise.reject(new TypeError('Failed to fetch'));
  });
}

describe('OrdersPage — деградация сети при загрузке заявок', () => {
  beforeEach(() => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('показывает «Не удалось загрузить заявки» и кнопку «Повторить» при сетевой ошибке', async () => {
    mockOrdersFetch(() => Promise.reject(new TypeError('Failed to fetch')));

    render(<OrdersPage />);

    expect(await screen.findByText('Не удалось загрузить заявки')).toBeInTheDocument();
    expect(screen.getByText('Нет соединения с сервером. Проверьте интернет')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });

  it('кнопка «Повторить» повторно запрашивает заявки и восстанавливает список после успеха', async () => {
    let attempt = 0;
    mockOrdersFetch(() => {
      attempt += 1;
      if (attempt === 1) return Promise.reject(new TypeError('Failed to fetch'));
      return Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ data: [], total: 0, current_page: 1, last_page: 1, per_page: 50 }),
      });
    });

    render(<OrdersPage />);

    const retryBtn = await screen.findByRole('button', { name: 'Повторить' });
    fireEvent.click(retryBtn);

    await waitFor(() => {
      expect(screen.queryByText('Не удалось загрузить заявки')).not.toBeInTheDocument();
    });
    expect(attempt).toBe(2);
  });
});
