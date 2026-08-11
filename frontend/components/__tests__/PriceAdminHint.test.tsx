import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import OrderForm from '@/components/OrderForm';
import { Order } from '@/lib/api';

function makeOrder(): Order {
  return {
    id: 42,
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
    importance: 'ТЕКУЩАЯ в течении 48 часов',
    importance_other: '',
    created_by: { id: 1, login: 'admin', email: 'a@a.ru', fio: 'Админ', type_user: 1 },
    created_for: null,
    comments: null,
    comment_manager: '',
    status: 1,
    is_archived: 0,
  };
}

describe('OrderForm — живой пересчёт price_admin (#32)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('при вводе price подсказка показывает price*0.7', () => {
    render(<OrderForm role={1} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('Стоимость *'), { target: { value: '10000' } });

    expect(screen.getByText(/price_admin = 7000/i)).toBeInTheDocument();
  });

  it('подсказка не показывается монтажнику (нет price_admin)', () => {
    render(<OrderForm role={3} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('Стоимость *'), { target: { value: '10000' } });

    expect(screen.queryByText(/price_admin = /i)).not.toBeInTheDocument();
  });

  it('при редактировании с непустым price_admin подсказка не нужна', () => {
    render(<OrderForm role={1} order={makeOrder()} onSaved={() => {}} />);

    expect(screen.queryByText(/price_admin = /i)).not.toBeInTheDocument();
  });

  it('нечисловой price (например «По факту») не даёт пересчёт', () => {
    render(<OrderForm role={1} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('Стоимость *'), { target: { value: 'По факту' } });

    expect(screen.queryByText(/price_admin = /i)).not.toBeInTheDocument();
  });
});
