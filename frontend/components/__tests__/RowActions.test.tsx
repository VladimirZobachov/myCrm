import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RowActions from '@/components/RowActions';
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

describe('RowActions (#84 — меню по Figma с иконками)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('кнопка «Действия» (три точки) скрыта до клика — действия открываются в дропдауне', () => {
    render(<RowActions order={makeOrder()} role={1} onChanged={() => {}} />);
    expect(screen.queryByText('Редактировать')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    expect(screen.getByText('Редактировать')).toBeInTheDocument();
    expect(screen.getByText('Копировать')).toBeInTheDocument();
    expect(screen.getByText('Комментарий')).toBeInTheDocument();
    expect(screen.getByText('Сменить статус')).toBeInTheDocument();
  });

  it('кнопка «Действия» (три точки) имеет touch-таргет не меньше 44px', () => {
    render(<RowActions order={makeOrder()} role={1} onChanged={() => {}} />);
    const button = screen.getByRole('button', { name: 'Действия' });
    expect(button.className).toContain('min-h-[44px]');
    expect(button.className).toContain('min-w-[44px]');
  });

  it('пункт «Редактировать» ведёт на /orders/{id}/edit', () => {
    render(<RowActions order={makeOrder({ id: 87 })} role={1} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    const editLink = screen.getByText('Редактировать').closest('a');
    expect(editLink).toHaveAttribute('href', '/orders/87/edit');
  });

  it('каждый пункт меню имеет иконку (svg)', () => {
    render(<RowActions order={makeOrder()} role={1} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    for (const label of ['Редактировать', 'Сменить статус', 'Копировать', 'Комментарий', 'В архив', 'Удалить']) {
      const item = screen.getByText(label).closest('a, button');
      expect(item?.querySelector('svg')).toBeTruthy();
    }
  });

  it('админ видит в меню пункты Архив и Удалить', () => {
    render(<RowActions order={makeOrder()} role={1} onChanged={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    expect(screen.getByText('В архив')).toBeInTheDocument();
    expect(screen.getByText('Удалить')).toBeInTheDocument();
  });

  it('менеджер и монтажник НЕ видят пункты Архив и Удалить', () => {
    for (const role of [2, 3]) {
      const { unmount } = render(<RowActions order={makeOrder()} role={role} onChanged={() => {}} />);
      fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
      expect(screen.queryByText('В архив')).not.toBeInTheDocument();
      expect(screen.queryByText('Удалить')).not.toBeInTheDocument();
      unmount();
    }
  });

  it('смена статуса (через пункт «Сменить статус») вызывает API и onChanged', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOrder(),
    });

    const onChanged = vi.fn();
    render(<RowActions order={makeOrder()} role={3} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    fireEvent.click(screen.getByText('Сменить статус'));
    fireEvent.click(screen.getByLabelText('готов'));
    fireEvent.click(screen.getByRole('button', { name: 'Применить' }));

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

    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    fireEvent.click(screen.getByText('Комментарий'));
    fireEvent.change(screen.getByLabelText('Комментарий *'), { target: { value: 'Принял в работу' } });
    fireEvent.click(screen.getByRole('button', { name: 'Отправить' }));

    await waitFor(() => {
      const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
      expect(String(url)).toContain('/orders/42/comment');
      expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ comment: 'Принял в работу' });
    });
  });

  it('«В архив» вызывает API /archive', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...makeOrder(), is_archived: 1 }),
    });

    const onChanged = vi.fn();
    render(<RowActions order={makeOrder()} role={1} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    fireEvent.click(screen.getByText('В архив'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders/42/archive');
    expect(JSON.parse((opts as RequestInit).body as string)).toEqual({ archived: true });
  });

  it('«Копировать» вызывает POST /orders с данными текущего заказа', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => makeOrder({ id: 100 }),
    });

    const onChanged = vi.fn();
    render(<RowActions order={makeOrder()} role={1} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    fireEvent.click(screen.getByText('Копировать'));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders');
    expect(String(url)).not.toContain('/orders/42');
    expect((opts as RequestInit).method).toBe('POST');
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.trc).toBe('Гринвич');
    expect(body.type_work).toBe('Монтаж');
    expect(body.brand).toBe('Тест');
    expect(body.price).toBe('5000');
  });

  it('«Удалить» открывает подтверждение и вызывает DELETE /orders/{id}, доступно только админу', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ message: 'ok' }),
    });

    const onChanged = vi.fn();
    render(<RowActions order={makeOrder()} role={1} onChanged={onChanged} />);

    fireEvent.click(screen.getByRole('button', { name: 'Действия' }));
    fireEvent.click(screen.getByText('Удалить'));

    expect(screen.getByText('Удалить заказ?')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Удалить' }));

    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders/42');
    expect((opts as RequestInit).method).toBe('DELETE');
  });
});
