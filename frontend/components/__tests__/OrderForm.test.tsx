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

describe('OrderForm (TDD)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('показывает все обязательные поля', () => {
    render(<OrderForm role={1} onSaved={() => {}} />);
    expect(screen.getByText('ТРЦ *')).toBeInTheDocument();
    expect(screen.getByLabelText('Дата монтажа *')).toBeInTheDocument();
    expect(screen.getByLabelText('Вид работ *')).toBeInTheDocument();
    expect(screen.getByLabelText('Бренд *')).toBeInTheDocument();
    expect(screen.getByText('Где печать *')).toBeInTheDocument();
    expect(screen.getByLabelText('Стоимость *')).toBeInTheDocument();
    expect(screen.getByText('Важность *')).toBeInTheDocument();
  });

  it('поле price_admin видно только админу', () => {
    const { unmount } = render(<OrderForm role={1} onSaved={() => {}} />);
    expect(screen.getByLabelText(/Стоимость адм/i)).toBeInTheDocument();
    unmount();

    render(<OrderForm role={3} onSaved={() => {}} />);
    expect(screen.queryByLabelText(/Стоимость адм/i)).not.toBeInTheDocument();
  });

  it('поле Монтажник (created_for) видно только админу', () => {
    const { unmount } = render(<OrderForm role={1} onSaved={() => {}} />);
    expect(screen.getByLabelText(/Монтажник/i)).toBeInTheDocument();
    unmount();

    render(<OrderForm role={3} onSaved={() => {}} />);
    expect(screen.queryByLabelText(/Монтажник/i)).not.toBeInTheDocument();
  });

  it('поле trc_other появляется при выборе «Другое»', () => {
    render(<OrderForm role={1} onSaved={() => {}} />);
    expect(screen.queryByLabelText('Укажите ТРЦ *')).not.toBeInTheDocument();

    // «Другое» есть в двух группах (ТРЦ и Где печать) — берём из ТРЦ
    const trcOther = screen.getAllByLabelText('Другое')[0];
    fireEvent.click(trcOther);
    expect(screen.getByLabelText('Укажите ТРЦ *')).toBeInTheDocument();
  });

  it('required-поля блокируют сабмит без заполнения', async () => {
    render(<OrderForm role={3} onSaved={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Добавить/i }));

    await waitFor(() => {
      expect(screen.getByText(/Вид работ/i)).toBeInTheDocument();
    });
    // submit не вызван
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('валидная форма вызывает POST /orders', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => makeOrder(),
    });

    render(<OrderForm role={3} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('Дата монтажа *'), { target: { value: '2026-08-20' } });
    fireEvent.change(screen.getByLabelText('Вид работ *'), { target: { value: 'Монтаж баннера' } });
    fireEvent.change(screen.getByLabelText('Бренд *'), { target: { value: 'Тест' } });
    fireEvent.change(screen.getByLabelText('Стоимость *'), { target: { value: '5000' } });
    fireEvent.click(screen.getByRole('button', { name: /Добавить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders');
    expect((opts as RequestInit).method).toBe('POST');
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.type_work).toBe('Монтаж баннера');
    expect(body.brand).toBe('Тест');
    expect(body.price).toBe('5000');
    expect(body.trc).toBeDefined();
    expect(body.where_print).toBeDefined();
    expect(body.importance).toBeDefined();
  });

  it('режим редактирования: prefill + PUT', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOrder(),
    });

    render(<OrderForm role={1} order={makeOrder()} onSaved={() => {}} />);

    // Prefill
    expect(screen.getByLabelText('Вид работ *')).toHaveValue('Монтаж баннера');
    expect(screen.getByLabelText('Бренд *')).toHaveValue('Тест');
    expect(screen.getByLabelText('Стоимость *')).toHaveValue('5000');

    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/orders/42');
    expect((opts as RequestInit).method).toBe('PATCH');
  });

  it('#83: введённый текст в полях ввода тёмный (text-slate-900), а не светло-серый', () => {
    render(<OrderForm role={1} onSaved={() => {}} />);
    expect(screen.getByLabelText('Вид работ *').className).toContain('text-slate-900');
    expect(screen.getByLabelText('Бренд *').className).toContain('text-slate-900');
    expect(screen.getByLabelText('Стоимость *').className).toContain('text-slate-900');
    expect(screen.getByLabelText('Дата монтажа *').className).toContain('text-slate-900');
    expect(screen.getByLabelText('Монтажник').className).toContain('text-slate-900');
  });

  it('onSaved вызывается после сохранения', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => makeOrder(),
    });

    const onSaved = vi.fn();
    render(<OrderForm role={3} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText('Дата монтажа *'), { target: { value: '2026-08-20' } });
    fireEvent.change(screen.getByLabelText('Вид работ *'), { target: { value: 'Монтаж' } });
    fireEvent.change(screen.getByLabelText('Бренд *'), { target: { value: 'Тест' } });
    fireEvent.change(screen.getByLabelText('Стоимость *'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: /Добавить/i }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
