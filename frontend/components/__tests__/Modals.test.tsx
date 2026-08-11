import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CommentModal from '@/components/CommentModal';
import StatusModal from '@/components/StatusModal';

describe('StatusModal (#34)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('показывает 3 радио-статуса и закрывает по отмене', () => {
    const onClose = vi.fn();
    render(<StatusModal current={1} onClose={onClose} onApply={() => {}} />);

    expect(screen.getByLabelText(/ждет/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/принят/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/готов/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Отмена/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it('текущий статус отмечен радио', () => {
    render(<StatusModal current={2} onClose={() => {}} onApply={() => {}} />);
    expect(screen.getByLabelText(/принят/i)).toBeChecked();
  });

  it('onApply вызывается с выбранным статусом', () => {
    const onApply = vi.fn();
    render(<StatusModal current={1} onClose={() => {}} onApply={onApply} />);

    fireEvent.click(screen.getByLabelText(/готов/i));
    fireEvent.click(screen.getByRole('button', { name: /Применить/i }));

    expect(onApply).toHaveBeenCalledWith(3);
  });
});

describe('CommentModal (#34)', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('показывает textarea для комментария', () => {
    render(<CommentModal role={1} onClose={() => {}} onApply={() => {}} />);
    expect(screen.getByLabelText(/Комментарий/i)).toBeInTheDocument();
  });

  it('админ видит селект «кому» (админу/менеджеру)', () => {
    render(<CommentModal role={1} onClose={() => {}} onApply={() => {}} />);
    expect(screen.getByLabelText(/Кому/i)).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Админу/i })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: /Менеджеру/i })).toBeInTheDocument();
  });

  it('монтажник НЕ видит селект «кому»', () => {
    render(<CommentModal role={3} onClose={() => {}} onApply={() => {}} />);
    expect(screen.queryByLabelText(/Кому/i)).not.toBeInTheDocument();
  });

  it('onApply получает comment и for (для админа)', () => {
    const onApply = vi.fn();
    render(<CommentModal role={1} onClose={() => {}} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText(/Комментарий/i), { target: { value: 'Проверить объект' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить/i }));

    expect(onApply).toHaveBeenCalledWith('Проверить объект', 2);
  });

  it('onApply без for для монтажника', () => {
    const onApply = vi.fn();
    render(<CommentModal role={3} onClose={() => {}} onApply={onApply} />);

    fireEvent.change(screen.getByLabelText(/Комментарий/i), { target: { value: 'Принял в работу' } });
    fireEvent.click(screen.getByRole('button', { name: /Отправить/i }));

    expect(onApply).toHaveBeenCalledWith('Принял в работу', undefined);
  });
});
