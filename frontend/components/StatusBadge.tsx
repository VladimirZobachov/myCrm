// Статус-бейджи (из дизайн-токенов: 1=warning, 2=info, 3=success, архив=neutral)
const STATUS_MAP: Record<number, { label: string; cls: string }> = {
  1: { label: 'В ожидании', cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  2: { label: 'Принят', cls: 'bg-sky-50 text-sky-700 border-sky-200' },
  3: { label: 'Выполнено', cls: 'bg-green-50 text-green-700 border-green-200' },
};

export function StatusBadge({ status, archived }: { status: number; archived?: number }) {
  if (archived) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600">
        <span className="size-1.5 rounded-full bg-slate-400" />
        Архив
      </span>
    );
  }
  const s = STATUS_MAP[status] ?? { label: `Статус ${status}`, cls: 'bg-slate-50 text-slate-600 border-slate-200' };
  const dotCls =
    status === 1 ? 'bg-amber-500' : status === 2 ? 'bg-sky-500' : status === 3 ? 'bg-green-500' : 'bg-slate-400';
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${dotCls}`} />
      {s.label}
    </span>
  );
}

export function formatDate(d: string): string {
  if (!d) return '';
  return d.slice(0, 10);
}
