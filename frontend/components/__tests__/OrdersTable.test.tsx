import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrdersTable from '@/components/OrdersTable';
import { Order } from '@/lib/api';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 1,
    date_create: '2026-08-11T10:00:00.000000Z',
    date: '2026-08-12',
    trc: 'Гринвич',
    trc_other: null,
    type_work: 'Монтаж баннера',
    brand: 'Тест',
    where_print: 'Дельта Принт',
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

describe('OrdersTable — ролевая видимость колонок', () => {
  const onSort = vi.fn();
  const onChanged = vi.fn();

  it('админ видит все колонки (вкл. price_admin, Монтажник, Ком-ий мен.)', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('Ст-ть адм.')).toBeInTheDocument();
    expect(screen.getByText('Монтажник')).toBeInTheDocument();
    expect(screen.getByText('Ком-ий мен.')).toBeInTheDocument();
    expect(screen.getByText('Менеджер')).toBeInTheDocument();
  });

  it('менеджер НЕ видит price_admin и Монтажник, но видит Менеджер', () => {
    render(<OrdersTable orders={[makeOrder()]} role={2} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.queryByText('Ст-ть адм.')).not.toBeInTheDocument();
    expect(screen.queryByText('Монтажник')).not.toBeInTheDocument();
    expect(screen.getByText('Менеджер')).toBeInTheDocument();
  });

  it('монтажник НЕ видит Менеджер, Монтажник, price_admin, Ком-ий мен.', () => {
    render(<OrdersTable orders={[makeOrder()]} role={3} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.queryByText('Менеджер')).not.toBeInTheDocument();
    expect(screen.queryByText('Монтажник')).not.toBeInTheDocument();
    expect(screen.queryByText('Ст-ть адм.')).not.toBeInTheDocument();
    expect(screen.queryByText('Ком-ий мен.')).not.toBeInTheDocument();
    expect(screen.getByText('Ст-ть')).toBeInTheDocument();
  });

  it('показывает данные заказа', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('Гринвич')).toBeInTheDocument();
    expect(screen.getByText('Монтаж баннера')).toBeInTheDocument();
  });

  it('клик по сортируемой колонке вызывает onSort', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    screen.getByText('ТРЦ').click();
    expect(onSort).toHaveBeenCalledWith('trc');
  });
});
