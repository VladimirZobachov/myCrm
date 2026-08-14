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

  it('нет отдельной ручки drag-and-drop — карточка перетаскивается целиком, тап по ней по-прежнему разворачивает аккордеон', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} />);
    expect(screen.queryByRole('button', { name: /Изменить порядок/ })).not.toBeInTheDocument();

    const toggle = screen.getByRole('button', { name: /№42/ });
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
  });

  it('карточка целиком перетаскиваема (role="group" от useSortable на корневом div)', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} />);
    const card = screen.getByRole('group', { name: /Заявка №42/ });
    expect(card).toHaveAttribute('tabindex', '0');
  });
});

describe('MobileOrderCard — групповой выбор (чекбокс скрыт вне режима выбора)', () => {
  const onChanged = vi.fn();

  it('чекбокс не рендерится по умолчанию (selectionMode выключен)', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} />);
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
  });

  it('в режиме выбора чекбокс появляется и клик по нему вызывает onToggleSelect', () => {
    const onToggleSelect = vi.fn();
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} selectionMode onToggleSelect={onToggleSelect} />);

    const checkbox = screen.getByRole('checkbox', { name: 'Выбрать заявку №42' });
    fireEvent.click(checkbox);
    expect(onToggleSelect).toHaveBeenCalledWith(42);
  });

  it('клик по чекбоксу не переключает разворот аккордеона', () => {
    render(<MobileOrderCard order={makeOrder()} role={1} onChanged={onChanged} selectionMode />);

    const checkbox = screen.getByRole('checkbox', { name: 'Выбрать заявку №42' });
    fireEvent.click(checkbox);
    expect(screen.getByRole('button', { name: /№42/ })).toHaveAttribute('aria-expanded', 'false');
  });
});
