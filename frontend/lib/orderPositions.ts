// Ручной порядок заявок хранится в БД как ПОЛНЫЙ список order_id для
// пользователя (PUT /orders/positions заменяет весь список целиком).
// Drag-and-drop на клиенте работает только со страницей (50 заявок), поэтому
// перед сохранением новый порядок текущей страницы нужно вклеить в ранее
// известный полный список, не потеряв позиции заявок с других страниц.
export function mergeManualOrder(existing: number[] | null, pageOrder: number[]): number[] {
  if (!existing) return pageOrder;

  const pageSet = new Set(pageOrder);
  const result: number[] = [];
  let inserted = false;

  for (const id of existing) {
    if (pageSet.has(id)) {
      if (!inserted) {
        result.push(...pageOrder);
        inserted = true;
      }
      // остальные id этой страницы уже вставлены единым блоком — пропускаем
    } else {
      result.push(id);
    }
  }

  if (!inserted) result.push(...pageOrder);

  return result;
}
