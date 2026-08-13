import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import MigrationMetrics from '@/components/MigrationMetrics';
import { MigrationMetrics as MigrationMetricsData } from '@/lib/api';

function makeData(): MigrationMetricsData {
  return {
    total: 9,
    migrated: 5,
    percent: 55.6,
    by_role: [
      { role: 1, total: 2, migrated: 1, percent: 50 },
      { role: 2, total: 4, migrated: 1, percent: 25 },
      { role: 3, total: 3, migrated: 3, percent: 100 },
    ],
  };
}

describe('MigrationMetrics (#64)', () => {
  it('показывает карточки статистики: всего, мигрировано, процент', () => {
    render(<MigrationMetrics data={makeData()} />);

    // "Всего"/"Мигрировано" встречаются и в карточках, и в заголовке таблицы
    expect(screen.getAllByText('Всего').length).toBeGreaterThan(0);
    expect(screen.getByText('9')).toBeInTheDocument();
    expect(screen.getAllByText('Мигрировано').length).toBeGreaterThan(0);
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Процент')).toBeInTheDocument();
    expect(screen.getByText('55.6%')).toBeInTheDocument();
  });

  it('показывает таблицу по ролям с названиями ролей', () => {
    render(<MigrationMetrics data={makeData()} />);

    expect(screen.getByText('Администратор')).toBeInTheDocument();
    expect(screen.getByText('Менеджер')).toBeInTheDocument();
    expect(screen.getByText('Монтажник')).toBeInTheDocument();
  });

  it('рендерит прогресс-бар для каждой роли с корректным aria-valuenow', () => {
    render(<MigrationMetrics data={makeData()} />);

    const bars = screen.getAllByRole('progressbar');
    expect(bars).toHaveLength(3);
    expect(bars[0]).toHaveAttribute('aria-valuenow', '50');
    expect(bars[1]).toHaveAttribute('aria-valuenow', '25');
    expect(bars[2]).toHaveAttribute('aria-valuenow', '100');
  });

  it('обрабатывает пустой список ролей без ошибок', () => {
    render(<MigrationMetrics data={{ total: 0, migrated: 0, percent: 0, by_role: [] }} />);

    expect(screen.getAllByText('Всего').length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('progressbar')).toHaveLength(0);
  });
});
