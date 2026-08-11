import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileForm from '@/components/ProfileForm';

const USER = { id: 38, login: 'admin', email: 'admin@mycrm.local', fio: 'Тестовый админ', type_user: 1 };

describe('ProfileForm (#41)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  it('показывает email/ФИО (login и роль неизменяемы)', () => {
    render(<ProfileForm user={USER} onSaved={() => {}} />);
    expect(screen.getByLabelText('E-mail *')).toHaveValue('admin@mycrm.local');
    expect(screen.getByLabelText('ФИО')).toHaveValue('Тестовый админ');
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('Администратор')).toBeInTheDocument();
  });

  it('смена email/ФИО → PATCH /api/bff/me', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: { ...USER, email: 'new@mail.ru' } }),
    });

    render(<ProfileForm user={USER} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('E-mail *'), { target: { value: 'new@mail.ru' } });
    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    expect(String(url)).toBe('/api/bff/me');
    expect((opts as RequestInit).method).toBe('PATCH');
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.email).toBe('new@mail.ru');
    expect(body).not.toHaveProperty('passwd');
  });

  it('пустой пароль = не менять (не передаётся в body)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: USER }),
    });

    render(<ProfileForm user={USER} onSaved={() => {}} />);

    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body).not.toHaveProperty('passwd');
  });

  it('заполненный новый пароль передаётся', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: USER }),
    });

    render(<ProfileForm user={USER} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'newpass123' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'newpass123' } });
    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => expect(global.fetch).toHaveBeenCalled());
    const [url, opts] = (global.fetch as ReturnType<typeof vi.fn>).mock.calls[0];
    const body = JSON.parse((opts as RequestInit).body as string);
    expect(body.passwd).toBe('newpass123');
  });

  it('пароли не совпадают — ошибка без вызова API', async () => {
    render(<ProfileForm user={USER} onSaved={() => {}} />);

    fireEvent.change(screen.getByLabelText('Новый пароль'), { target: { value: 'aaa111' } });
    fireEvent.change(screen.getByLabelText('Повторите пароль'), { target: { value: 'bbb222' } });
    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));

    await waitFor(() => expect(screen.getByText(/пароли не совпадают/i)).toBeInTheDocument());
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('onSaved вызывается после успеха', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ user: USER }),
    });

    const onSaved = vi.fn();
    render(<ProfileForm user={USER} onSaved={onSaved} />);

    fireEvent.click(screen.getByRole('button', { name: /Сохранить/i }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
  });
});
