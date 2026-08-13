// Статус-бейджи (цвета — по Figma: 1=голубой контур, 2=янтарный, 3=зелёный).
const STATUS_MAP: Record<number, { label: string; cls: string; dot: string }> = {
  1: { label: 'ждет', cls: 'bg-sky-50 text-sky-700 border-sky-200', dot: 'bg-sky-500' },
  2: { label: 'принят', cls: 'bg-amber-500 text-white border-amber-500', dot: 'bg-white' },
  3: { label: 'готов', cls: 'bg-green-500 text-white border-green-500', dot: 'bg-white' },
};

// Общий список статусов (StatusModal, StatusQuickChange) — держит порядок/подписи в одном месте.
export const STATUS_OPTIONS = [
  { value: 1, label: STATUS_MAP[1].label },
  { value: 2, label: STATUS_MAP[2].label },
  { value: 3, label: STATUS_MAP[3].label },
];

export function StatusBadge({
  status,
  archived,
  withCaret,
}: {
  status: number;
  archived?: number;
  withCaret?: boolean;
}) {
  if (archived) {
    return (
      <span className="inline-flex items-center gap-1.5 h-7 rounded-full border border-slate-200 bg-slate-100 px-3 text-xs font-semibold text-slate-600 whitespace-nowrap">
        <span className="size-1.5 rounded-full bg-slate-400" />
        <span>Архив</span>
      </span>
    );
  }
  const s = STATUS_MAP[status] ?? { label: `Статус ${status}`, cls: 'bg-slate-50 text-slate-600 border-slate-200', dot: 'bg-slate-400' };
  return (
    <span className={`inline-flex items-center gap-1.5 h-7 rounded-full border px-3 text-xs font-semibold whitespace-nowrap ${s.cls}`}>
      <span className={`size-1.5 rounded-full ${s.dot}`} />
      <span>{s.label}</span>
      {withCaret && (
        <svg aria-hidden viewBox="0 0 20 20" className="size-3 opacity-70">
          <path d="M5.5 7.5l4.5 4.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
  );
}

export function formatDate(d: string): string {
  if (!d) return '';
  return d.slice(0, 10);
}
