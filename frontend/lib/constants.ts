// Справочники из legacy configs/form_data.php (1:1)

export const TRC_OPTIONS = [
  'Радуга парк', 'Академ', 'Алатырь', 'Аутлет', 'Веер', 'Кит Ехб',
  'Глобус', 'Гринвич', 'Пассаж', 'Фан-Фан', 'КОМСОМОЛЛ', 'Мега', 'Другое',
];

export const WHERE_OPTIONS = [
  'Солнечный город', 'Мастерра', 'Дельта Принт', 'Сила Принта', 'Другое',
];

export const IMPORTANCE_OPTIONS = [
  'ВЫСОКАЯ в течении 24 часов',
  'ТЕКУЩАЯ в течении 48 часов',
  'НИЗКАЯ в течении 52 часов',
];

// Короткое представление важности для таблицы заказов (как в Figma: «Текущая 48 ч»).
// Принимает и полную legacy-строку («ТЕКУЩАЯ в течении 48 часов»), и короткий enum («ТЕКУЩАЯ»).
export function importanceBadge(importance: string): { label: string; cls: string } {
  const s = (importance || '').toLowerCase();
  if (s.startsWith('высок')) return { label: 'Высокая 24 ч', cls: 'border-red-300 text-red-600 bg-red-50' };
  if (s.startsWith('низк')) return { label: 'Низкая 52 ч', cls: 'border-green-300 text-green-600 bg-green-50' };
  if (s.startsWith('текущ')) return { label: 'Текущая 48 ч', cls: 'border-sky-300 text-sky-600 bg-sky-50' };
  return { label: importance || '—', cls: 'border-slate-300 text-slate-600 bg-slate-50' };
}
