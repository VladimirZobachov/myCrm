import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UsersTable from '@/components/UsersTable';
import { User } from '@/lib/api';

function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    login: 'admin',
    email: 'admin@mycrm.local',
    fio: 'Админ',
    type_user: 1,
    ...overrides,
  };
}

describe('UsersTable (#36-37)', () => {
  it('показывает логин, email, ФИО и роль', () => {
    const users = [
      makeUser({ id: 1, login: 'admin', email: 'a@a.ru', fio: 'Админ', type_user: 1 }),
      makeUser({ id: 2, login: 'manager', email: 'm@m.ru', fio: 'Менеджер', type_user: 2 }),
      makeUser({ id: 3, login: 'mounter', email: 'mo@mo.ru', fio: 'Иванов Иван', type_user: 3 }),
    ];
    render(<UsersTable users={users} onEdit={() => {}} onDelete={() => {}} />);

    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText('a@a.ru')).toBeInTheDocument();
    expect(screen.getByText('Админ')).toBeInTheDocument();
    expect(screen.getByText('manager')).toBeInTheDocument();
    expect(screen.getByText('Монтажник')).toBeInTheDocument();
  });

  it('показывает текстовые названия ролей', () => {
    render(<UsersTable users={[makeUser()]} onEdit={() => {}} onDelete={() => {}} />);
    expect(screen.getByText('Администратор')).toBeInTheDocument();
  });

  it('кнопка удаления видна и вызывает onDelete', () => {
    const onDelete = vi.fn();
    render(<UsersTable users={[makeUser()]} onEdit={() => {}} onDelete={onDelete} />);
    fireEvent.click(screen.getByRole('button', { name: /Удалить/i }));
    expect(onDelete).toHaveBeenCalledWith(1);
  });

  it('кнопка редактирования вызывает onEdit', () => {
    const onEdit = vi.fn();
    render(<UsersTable users={[makeUser()]} onEdit={onEdit} onDelete={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: /Редактировать/i }));
    expect(onEdit).toHaveBeenCalledWith(1);
  });
});
