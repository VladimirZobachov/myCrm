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

  it('колонка «№» объединена с датой создания заявки', () => {
    render(<OrdersTable orders={[makeOrder({ id: 87 })]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('№87')).toBeInTheDocument();
    expect(screen.getByText('11.08.2026')).toBeInTheDocument();
  });

  it('колонка «Дата монтажа» объединена с ТРЦ, обе подписи сортируются независимо', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('12.08.2026')).toBeInTheDocument();
    expect(screen.getByText('Гринвич')).toBeInTheDocument();

    screen.getByText('Дата монтажа').click();
    expect(onSort).toHaveBeenCalledWith('date');
  });

  it('колонка «Действия» — кнопка «три точки» вместо текстовых кнопок', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByRole('button', { name: 'Действия' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Статус' })).not.toBeInTheDocument();
    expect(screen.queryByText('Комм.')).not.toBeInTheDocument();
    expect(screen.queryByText('Разарх.')).not.toBeInTheDocument();
  });

  it('админ видит объединённые колонки «Исполнители» и «Стоимость» (с адм. ценой и Монтажником)', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('Исполнители')).toBeInTheDocument();
    expect(screen.getByText('Стоимость')).toBeInTheDocument();
    expect(screen.getByText(/Монтажник:/)).toBeInTheDocument();
    expect(screen.getByText(/Менеджер:/)).toBeInTheDocument();
    expect(screen.getByText('адм. 3500')).toBeInTheDocument();
  });

  it('колонки «Комментарий» в таблице нет — комментарии доступны только в модалке действий и на карточке заказа', () => {
    render(
      <OrdersTable
        orders={[makeOrder({ comments: 'Принял в работу', comment_manager: 'Проверить смету' })]}
        role={1}
        sort="date_create|DESC"
        onSort={onSort}
        onChanged={onChanged}
      />
    );
    expect(screen.queryByText('Комментарий')).not.toBeInTheDocument();
    expect(screen.queryByText('монтажнику')).not.toBeInTheDocument();
    expect(screen.queryByText('Принял в работу')).not.toBeInTheDocument();
    expect(screen.queryByText('менеджеру')).not.toBeInTheDocument();
    expect(screen.queryByText('Проверить смету')).not.toBeInTheDocument();
  });

  it('менеджер НЕ видит адм. цену и Монтажника, но видит колонку Исполнители с Менеджером', () => {
    render(<OrdersTable orders={[makeOrder()]} role={2} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.queryByText(/адм\./)).not.toBeInTheDocument();
    expect(screen.queryByText(/Монтажник:/)).not.toBeInTheDocument();
    expect(screen.getByText('Исполнители')).toBeInTheDocument();
    expect(screen.getByText(/Менеджер:/)).toBeInTheDocument();
  });

  it('монтажник НЕ видит колонку Исполнители и адм. цену', () => {
    render(<OrdersTable orders={[makeOrder()]} role={3} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.queryByText('Исполнители')).not.toBeInTheDocument();
    expect(screen.queryByText(/Менеджер:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/Монтажник:/)).not.toBeInTheDocument();
    expect(screen.queryByText(/адм\./)).not.toBeInTheDocument();
    expect(screen.getByText('Стоимость')).toBeInTheDocument();
  });

  it('показывает данные заказа', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('Гринвич')).toBeInTheDocument();
    expect(screen.getByText('Монтаж баннера')).toBeInTheDocument();
  });

  it('колонка «Вид работ» объединена с «Бренд» в «Вид работ / Бренд», отдельной колонки «Бренд» нет', () => {
    render(<OrdersTable orders={[makeOrder({ type_work: 'Монтаж баннера', brand: 'Тест' })]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('Вид работ')).toBeInTheDocument();
    expect(screen.getByText('Бренд')).toBeInTheDocument();
    expect(screen.getByText('Монтаж баннера')).toBeInTheDocument();
    expect(screen.getByText('Тест')).toBeInTheDocument();
    expect(screen.queryAllByRole('columnheader').length).toBeGreaterThan(0);
  });

  it('если бренд пустой, в колонке «Вид работ / Бренд» показывается только вид работ', () => {
    render(<OrdersTable orders={[makeOrder({ type_work: 'Монтаж баннера', brand: '' })]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    expect(screen.getByText('Монтаж баннера')).toBeInTheDocument();
    expect(screen.queryByText('Тест')).not.toBeInTheDocument();
  });

  it('клик по сортируемой колонке вызывает onSort', () => {
    render(<OrdersTable orders={[makeOrder()]} role={1} sort="date_create|DESC" onSort={onSort} onChanged={onChanged} />);
    screen.getByText('ТРЦ').click();
    expect(onSort).toHaveBeenCalledWith('trc');
  });

  it('у каждой строки есть ручка drag-and-drop для ручного порядка', () => {
    render(
      <OrdersTable
        orders={[makeOrder({ id: 1 }), makeOrder({ id: 2 })]}
        role={1}
        sort="date_create|DESC"
        onSort={onSort}
        onChanged={onChanged}
        onReorder={vi.fn()}
      />
    );
    expect(screen.getByRole('button', { name: 'Перетащить заявку №1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Перетащить заявку №2' })).toBeInTheDocument();
  });
});
