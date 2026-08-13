import { describe, it, expect } from 'vitest';
import { mergeManualOrder } from '@/lib/orderPositions';

describe('mergeManualOrder — вклейка перетащенной страницы в полный ручной порядок', () => {
  it('без ранее сохранённого порядка — просто использует порядок страницы', () => {
    expect(mergeManualOrder(null, [3, 1, 2])).toEqual([3, 1, 2]);
  });

  it('заменяет блок известных id новым порядком на их прежнем месте', () => {
    const existing = [10, 1, 2, 3, 20];
    const pageOrder = [3, 1, 2]; // пользователь переставил внутри страницы
    expect(mergeManualOrder(existing, pageOrder)).toEqual([10, 3, 1, 2, 20]);
  });

  it('сохраняет относительный порядок заявок с других страниц', () => {
    const existing = [5, 6, 1, 2, 7, 8];
    const pageOrder = [2, 1];
    expect(mergeManualOrder(existing, pageOrder)).toEqual([5, 6, 2, 1, 7, 8]);
  });

  it('добавляет id страницы, которых не было в сохранённом порядке, в конец', () => {
    const existing = [1, 2];
    const pageOrder = [4, 5];
    expect(mergeManualOrder(existing, pageOrder)).toEqual([1, 2, 4, 5]);
  });

  it('не дублирует id при частичном пересечении', () => {
    const existing = [1, 2, 3];
    const pageOrder = [3, 4];
    const result = mergeManualOrder(existing, pageOrder);
    expect(result).toEqual([1, 2, 3, 4]);
    expect(new Set(result).size).toBe(result.length);
  });
});
