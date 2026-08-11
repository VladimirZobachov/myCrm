import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import RegisterForm from '@/components/RegisterForm';

describe('RegisterForm (#40)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('показывает логин/email/ФИО/пароль/роль', () => {
    render(<RegisterForm onRegistered={() => {}} />);
    expect(screen.getByLabelText('Логин *')).toBeInTheDocument();
    expect(screen.getByLabelText('E-mail *')).toBeInTheDocument();
    expect(screen.getByLabelText('ФИО')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль *')).toBeInTheDocument();
    expect(screen.getByLabelText('Роль *')).toBeInTheDocument();
  });

  it('роли: только менеджер и монтажник (без администратора)', () => {
    render(<RegisterForm onRegistered={() => {}} />);
    expect(screen.getByRole('option', { name: 'Менеджер' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Монтажник' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Администратор' })).not.toBeInTheDocument();
  });

  it('по умолчанию выбрана роль Монтажник (тип 3)', () => {
    render(<RegisterForm onRegistered={() => {}} />);
    expect(screen.getByLabelText('Роль *')).toHaveValue('3');
  });

  it('отправляет POST /api/bff/auth/register и вызывает onRegistered', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => ({ user: { id: 1 }, access_token: 'tok' }),
    });

    const onRegistered = vi.fn();
    render(<RegisterForm onRegistered={onRegistered} />);

    fireEvent.change(screen.getByLabelText('Логин *'), { target: { value: 'newmounter' } });
    fireEvent.change(screen.getByLabelText('E-mail *'), { target: { value: 'new@test.ru' } });
    fireEvent.change(screen.getByLabelText('Пароль *'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());

    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('/api/bff/auth/register');
    expect((opts as RequestInit).method).toBe('POST');
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.login).toBe('newmounter');
    expect(body.type_user).toBe(3);

    await waitFor(() => expect(onRegistered).toHaveBeenCalled());
  });

  it('показывает ошибку при 422', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 422,
      json: async () => ({ message: 'Логин уже занят' }),
    });

    render(<RegisterForm onRegistered={() => {}} />);

    fireEvent.change(screen.getByLabelText('Логин *'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByLabelText('E-mail *'), { target: { value: 'new@test.ru' } });
    fireEvent.change(screen.getByLabelText('Пароль *'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Зарегистрироваться/i }));

    await waitFor(() => expect(screen.getByText('Логин уже занят')).toBeInTheDocument());
  });
});
