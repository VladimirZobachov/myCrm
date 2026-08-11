import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RowActions from '@/components/RowActions';
import { Order } from '@/lib/api';

function makeOrder(): Order {
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
  };
}

describe('RowActions', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('админ видит кнопку Архив', () => {
    render(<RowActions order={makeOrder()} role={1} onChanged={() => {}} />);
    expect(screen.getByText('Архив')).toBeInTheDocument();
  });

  it('монтажник НЕ видит кнопку Архив', () => {
    render(<RowActions order={makeOrder()} role={3} onChanged={() => {}} />);
    expect(screen.queryByText('Архив')).not.toBeInTheDocument();
  });

  it('смена статуса вызывает API и onChanged', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOrder(),
    });

    const onChanged = vi.fn();
    render(<RowActions order={makeOrder()} role={3} onChanged={onChanged} />);

    fireEvent.click(screen.getByText('Статус'));
    fireEvent.click(screen.getByText('✅ Выполнено'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders/42/status');
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ status: 3 });
  });

  it('сохранение комментария вызывает API', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOrder(),
    });

    render(<RowActions order={makeOrder()} role={3} onChanged={() => {}} />);

    fireEvent.click(screen.getByText('Комм.'));
    fireEvent.change(screen.getByPlaceholderText('Текст комментария...'), { target: { value: 'Принял в работу' } });
    fireEvent.click(screen.getByText('Сохранить'));

    await waitFor(() => {
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(String(url)).toContain('/orders/42/comment');
      expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ comment: 'Принял в работу' });
    });
  });

  it('архив вызывает API /archive', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOrder({ is_archived: 1 }),
    });

    const onChanged = vi.fn();
    render(<RowActions order={makeOrder()} role={1} onChanged={onChanged} />);

    fireEvent.click(screen.getByText('Архив'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders/42/archive');
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ archived: true });
  });
});
