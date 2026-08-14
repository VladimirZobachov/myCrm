import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import OrdersPage from './page';

function mockOrdersFetch(ordersImpl: () => Promise<unknown>) {
  (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: unknown) => {
    const u = String(url);
    // /orders/positions — ручной порядок, отдельный запрос (глотается компонентом)
    if (u.includes('/orders/positions')) {
      return Promise.resolve({ ok: true, status: 200, json: async () => ({ order_ids: [] }) });
    }
    if (u.includes('/orders')) return ordersImpl();
    // /auth/me — не относится к загрузке заявок, ошибка тут проглатывается компонентом
    return Promise.reject(new TypeError('Failed to fetch'));
  });
}

function mockOrdersWithOneOrder() {
  mockOrdersFetch(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: async () => ({
        data: [
          {
            id: 1,
            date_create: '2026-08-11T10:00:00.000000Z',
            date: '2026-08-12',
            trc: 'Гринвич',
            trc_other: null,
            type_work: 'Монтаж баннера',
            brand: '',
            where_print: 'Дельта Принт',
            where_other: null,
            photo: '',
            price: '5000',
            price_admin: '3500',
            importance: 'ТЕКУЩАЯ',
            importance_other: '',
            created_by: null,
            created_for: null,
            comments: null,
            comment_manager: '',
            status: 1,
            is_archived: 0,
          },
        ],
        total: 1,
        current_page: 1,
        last_page: 1,
        per_page: 50,
      }),
    })
  );
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

describe('OrdersPage — групповой выбор заявок (главный чекбокс «Выбрать»)', () => {
  beforeEach(() => {
    (global.fetch as ReturnType<typeof vi.fn>).mockReset();
  });

  it('чекбоксы строк скрыты, пока не включён главный чекбокс', async () => {
    mockOrdersWithOneOrder();
    render(<OrdersPage />);

    const table = await screen.findByRole('table');
    expect(screen.getByRole('checkbox', { name: 'Выбрать' })).toBeInTheDocument();
    expect(within(table).queryByRole('checkbox', { name: /Выбрать заявку/ })).not.toBeInTheDocument();
  });

  it('включение главного чекбокса показывает чекбоксы строк, выбирает все заявки и открывает панель групповых действий', async () => {
    mockOrdersWithOneOrder();
    render(<OrdersPage />);

    const table = await screen.findByRole('table');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать' }));

    expect(within(table).getByRole('checkbox', { name: 'Выбрать заявку №1' })).toBeInTheDocument();
    expect(screen.getByText(/Выбрано: 1/)).toBeInTheDocument();
  });

  it('повторный клик по главному чекбоксу снимает выделение и выключает режим выбора', async () => {
    mockOrdersWithOneOrder();
    render(<OrdersPage />);

    const table = await screen.findByRole('table');
    const header = screen.getByRole('checkbox', { name: 'Выбрать' });
    fireEvent.click(header);
    expect(screen.getByText(/Выбрано: 1/)).toBeInTheDocument();

    fireEvent.click(header);
    expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument();
    expect(within(table).queryByRole('checkbox', { name: /Выбрать заявку/ })).not.toBeInTheDocument();
  });

  it('«×» в панели групповых действий снимает выделение и выключает режим выбора', async () => {
    mockOrdersWithOneOrder();
    render(<OrdersPage />);

    const table = await screen.findByRole('table');
    fireEvent.click(screen.getByRole('checkbox', { name: 'Выбрать' }));
    expect(screen.getByText(/Выбрано: 1/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Снять выделение' }));

    expect(screen.queryByText(/Выбрано:/)).not.toBeInTheDocument();
    expect(within(table).queryByRole('checkbox', { name: /Выбрать заявку/ })).not.toBeInTheDocument();
  });
});
