import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import UserFormModal from '@/components/UserFormModal';
import { User } from '@/lib/api';

function makeUser(): User {
  return {
    id: 1,
    login: 'admin',
    email: 'admin@mycrm.local',
    fio: 'Админ',
    type_user: 1,
  };
}

describe('UserFormModal (#38-39)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('показывает поля логин/email/ФИО/пароль/роль', () => {
    render(<UserFormModal onClose={() => {}} onSaved={() => {}} />);
    expect(screen.getByLabelText('Логин *')).toBeInTheDocument();
    expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    expect(screen.getByLabelText('ФИО')).toBeInTheDocument();
    expect(screen.getByLabelText('Пароль *')).toBeInTheDocument();
    expect(screen.getByLabelText('Роль *')).toBeInTheDocument();
  });

  it('роли: менеджер/монтажник/администратор', () => {
    render(<UserFormModal onClose={() => {}} onSaved={() => {}} />);
    expect(screen.getByRole('option', { name: 'Менеджер' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Монтажник' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'Администратор' })).toBeInTheDocument();
  });

  it('режим создания: POST /users', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 201,
      json: async () => makeUser(),
    });

    const onSaved = vi.fn();
    render(<UserFormModal onClose={() => {}} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText('Логин *'), { target: { value: 'newuser' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'new@test.ru' } });
    fireEvent.change(screen.getByLabelText('Пароль *'), { target: { value: 'secret' } });
    fireEvent.click(screen.getByRole('button', { name: /Добавить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/users');
    expect((opts as RequestInit).method).toBe('POST');
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.login).toBe('newuser');
    expect(body.type_user).toBe(2);
  });

  it('режим редактирования: prefill + PATCH, пароль не требуется', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeUser(),
    });

    render(<UserFormModal user={makeUser()} onClose={() => {}} onSaved={() => {}} />);

    expect(screen.getByLabelText('Логин *')).toHaveValue('admin');
    expect(screen.queryByLabelText('Пароль *')).not.toBeInTheDocument();
    expect(screen.getByText(/оставьте пустым/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toContain('/users/1');
    expect((opts as RequestInit).method).toBe('PATCH');
  });
});
