import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import MobileOrderCard from '@/components/MobileOrderCard';
import { Order } from '@/lib/api';

function makeOrder(overrides: Partial<Order> = {}): Order {
  return {
    id: 42,
    date_create: '2026-08-11T10:00:00.000000Z',
    date: '2026-08-12',
    trc: 'Гринвич',
    trc_other: null,
    type_work: 'Монтаж баннера',
    brand: 'Тестовый бренд',
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

describe('MobileOrderCard — аккордеон мобильной карточки заказа', () => {
  const onChanged = vi.fn();

  it('изначально свёрнута: показывает дату монтажа, ТРЦ, цену и статус, но не показывает вид работ/бренд', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} />);

    expect(screen.getByText('12.08.2026')).toBeInTheDocument();
    expect(screen.getByText('Гринвич')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('ждет')).toBeInTheDocument();
    expect(screen.queryByText('Монтаж баннера')).not.toBeInTheDocument();
    expect(screen.queryByText('Тестовый бренд')).not.toBeInTheDocument();

    expect(screen.getByRole('button', { name: /№42/ })).toHaveAttribute('aria-expanded', 'false');
  });

  it('тап по карточке разворачивает её и показывает вид работ/бренд', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: /№42/ }));

    expect(screen.getByText('Монтаж баннера')).toBeInTheDocument();
    expect(screen.getByText('Тестовый бренд')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /№42/ })).toHaveAttribute('aria-expanded', 'true');
  });

  it('повторный тап сворачивает карточку обратно', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} />);

    const toggle = screen.getByRole('button', { name: /№42/ });
    fireEvent.click(toggle);
    expect(screen.getByText('Монтаж баннера')).toBeInTheDocument();

    fireEvent.click(toggle);
    expect(screen.queryByText('Монтаж баннера')).not.toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
  });
});
