import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import OrderDetails from '@/components/OrderDetails';
import { Order } from '@/lib/api';

function makeOrder(): Order {
  return {
    id: 42,
    date_create: '2026-08-11T10:00:00.000000Z',
    date: '2026-08-12',
    trc: 'Гринвич',
    trc_other: null,
    type_work: 'Монтаж баннера на фасаде',
    brand: 'Тест',
    where_print: 'Дельта Принт',
    where_other: null,
    photo: 'http://joxi.ru/abc http://joxi.ru/def',
    price: '5000',
    price_admin: '3500',
    importance: 'ТЕКУЩАЯ в течении 48 часов',
    importance_other: '',
    created_by: { id: 1, login: 'admin', email: 'a@a.ru', fio: 'Админ', type_user: 1 },
    created_for: { id: 3, login: 'mounter', email: 'm@m.ru', fio: 'Иванов Иван', type_user: 3 },
    comments: 'Принял в работу',
    comment_manager: 'Проверить смету',
    status: 2,
    is_archived: 0,
  };
}

describe('OrderDetails (#35)', () => {
  it('показывает все ключевые поля заявки', () => {
    render(<OrderDetails order={makeOrder()} />);

    expect(screen.getByText('№42')).toBeInTheDocument();
    expect(screen.getByText('Гринвич')).toBeInTheDocument();
    expect(screen.getByText('Монтаж баннера на фасаде')).toBeInTheDocument();
    expect(screen.getByText('Тест')).toBeInTheDocument();
    expect(screen.getByText('Дельта Принт')).toBeInTheDocument();
    expect(screen.getByText('5000')).toBeInTheDocument();
    expect(screen.getByText('Иванов Иван')).toBeInTheDocument();
    expect(screen.getByText('Админ')).toBeInTheDocument();
  });

  it('статус «принят» виден', () => {
    render(<OrderDetails order={makeOrder()} />);
    expect(screen.getByText('принят')).toBeInTheDocument();
  });

  it('фотопривязка рендерит ссылки', () => {
    render(<OrderDetails order={makeOrder()} />);
    const links = screen.getAllByRole('link', { name: /joxi.ru/i });
    expect(links.length).toBe(2);
  });

  it('без фото — заглушка', () => {
    const o = makeOrder();
    o.photo = '';
    render(<OrderDetails order={o} />);
    expect(screen.queryByRole('link', { name: /joxi.ru/i })).not.toBeInTheDocument();
  });
});
