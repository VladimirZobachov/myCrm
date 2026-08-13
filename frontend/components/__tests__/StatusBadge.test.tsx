import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge, formatDate } from '@/components/StatusBadge';

describe('StatusBadge', () => {
  it('показывает «ждет» для статуса 1', () => {
    render(<StatusBadge status={1} />);
    expect(screen.getByText('ждет')).toBeInTheDocument();
  });

  it('показывает «принят» для статуса 2', () => {
    render(<StatusBadge status={2} />);
    expect(screen.getByText('принят')).toBeInTheDocument();
  });

  it('показывает «готов» для статуса 3', () => {
    render(<StatusBadge status={3} />);
    expect(screen.getByText('готов')).toBeInTheDocument();
  });

  it('показывает «Архив» при archived=1', () => {
    render(<StatusBadge status={1} archived={1} />);
    expect(screen.getByText('Архив')).toBeInTheDocument();
  });

  it('Архив перекрывает статус', () => {
    render(<StatusBadge status={3} archived={1} />);
    expect(screen.getByText('Архив')).toBeInTheDocument();
    expect(screen.queryByText('готов')).not.toBeInTheDocument();
  });

  it('неизвестный статус — «Статус N»', () => {
    render(<StatusBadge status={99} />);
    expect(screen.getByText('Статус 99')).toBeInTheDocument();
  });
});

describe('formatDate', () => {
  it('обрезает ISO до даты', () => {
    expect(formatDate('2026-08-11T12:00:00.000000Z')).toBe('11.08.2026');
  });

  it('пустая строка → пусто', () => {
    expect(formatDate('')).toBe('');
  });

  it('уже дата — остаётся', () => {
    expect(formatDate('2026-08-11')).toBe('11.08.2026');
  });
});
