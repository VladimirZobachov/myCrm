import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BatchActions from '@/components/BatchActions';

describe('BatchActions — групповое редактирование', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    (global.fetch as ReturnType<typeof vi.fn>).mockClear();
  });

  function mockFetch() {
    (global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: unknown) =>
      Promise.resolve({
        ok: true,
        status: 200,
        json: async () => ({ updated: [1, 2, 3] }),
      })
    );
  }

  it('не рендерится, если нет выбранных', () => {
    render(<BatchActions selectedIds={new Set()} role={1} onDone={() => {}} />);
    expect(screen.queryByText(/Выбрано/)).not.toBeInTheDocument();
  });

  it('показывает количество выбранных', () => {
    render(<BatchActions selectedIds={new Set([1, 2, 3])} role={1} onDone={() => {}} />);
    expect(screen.getByText('Выбрано: 3')).toBeInTheDocument();
  });

  it('смена статуса вызывает batchStatus с id', async () => {
    mockFetch();
    const onDone = vi.fn();
    render(<BatchActions selectedIds={new Set([1, 2, 3])} role={1} onDone={onDone} />);

    fireEvent.click(screen.getByText(/Статус/));
    fireEvent.click(screen.getByText('готов'));

    await waitFor(() => expect(onDone).toHaveBeenCalled());
    const calls = (global.fetch as ReturnType<typeof vi.fn>).mock.calls;
    const batchCall = calls.find((c) => String(c[0]).includes('batch-status'));
    expect(batchCall).toBeTruthy();
    const opts = (batchCall as [string, RequestInit])[1];
    const body = JSON.parse(String(opts.body));
    expect(body.order_ids).toEqual([1, 2, 3]);
    expect(body.status).toBe(3);
  });

  it('удаление видно только админу', () => {
    render(<BatchActions selectedIds={new Set([1])} role={3} onDone={() => {}} />);
    expect(screen.queryByText('Удалить')).not.toBeInTheDocument();
  });

  it('кнопка × снимает выделение (onDone)', () => {
    const onDone = vi.fn();
    render(<BatchActions selectedIds={new Set([1, 2])} role={1} onDone={onDone} />);
    fireEvent.click(screen.getByLabelText('Снять выделение'));
    expect(onDone).toHaveBeenCalled();
  });
});
