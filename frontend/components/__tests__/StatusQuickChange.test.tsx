import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import StatusQuickChange from '@/components/StatusQuickChange';
import { Order } from '@/lib/api';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 42,
    date_create: '2026-08-11T10:00:00.000000Z',
    date: '2026-08-12',
    trc: 'Гринвич',
    trc_other: null,
    type_work: 'Монтаж',
    brand: 'Тест',
    where_print: 'Дельта',
    where_other: null,
    photo: '',
    price: '5000',
    price_admin: '3500',
    importance: 'ТЕКУЩАЯ',
    importance_other: '',
    created_by: { id: 1, login: 'admin', email: 'a@a.ru', fio: 'Админ', type_user: 1 },
    created_for: null,
    comments: null,
    comment_manager: '',
    status: 1,
    is_archived: 0,
    ...overrides,
  };
}

describe('StatusQuickChange (#85 — быстрая смена статуса стрелкой)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('дропдаун со статусами скрыт до клика по стрелке', () => {
    render(<StatusQuickChange order={makeOrder()} onChanged={() => {}} />);
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('клик по бейджу-стрелке открывает компактный дропдаун со всеми статусами', () => {
    render(<StatusQuickChange order={makeOrder({ status: 1 })} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сменить статус' }));

    const listbox = screen.getByRole('listbox');
    expect(listbox).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /ждет/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /принят/ })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /готов/ })).toBeInTheDocument();
  });

  it('текущий статус отмечен галочкой (aria-selected)', () => {
    render(<StatusQuickChange order={makeOrder({ status: 2 })} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Сменить статус' }));

    expect(screen.getByRole('option', { name: /принят/ })).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('option', { name: /ждет/ })).toHaveAttribute('aria-selected', 'false');
  });

  it('выбор другого статуса вызывает PATCH /orders/{id}/status и onChanged', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOrder({ status: 3 }),
    });

    const onChanged = vi.fn();
    render(<StatusQuickChange order={makeOrder({ id: 87, status: 1 })} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Сменить статус' }));
    fireEvent.click(screen.getByRole('option', { name: /готов/ }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders/87/status');
    expect((opts as RequestInit).method).toBe('PATCH');
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ status: 3 });

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('выбор текущего статуса не отправляет запрос', () => {
    global.fetch = vi.fn();
    render(<StatusQuickChange order={makeOrder({ status: 1 })} onChanged={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: 'Сменить статус' }));
    fireEvent.click(screen.getByRole('option', { name: /ждет/ }));

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('архивный заказ показывает бейдж «Архив» без стрелки для смены статуса', () => {
    render(<StatusQuickChange order={makeOrder({ is_archived: 1 })} onChanged={() => {}} />);
    expect(screen.getByText('Архив')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Сменить статус' })).not.toBeInTheDocument();
  });
});
