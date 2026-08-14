import { PointerSensor, PointerSensorOptions } from '@dnd-kit/core';
import type { PointerEvent as ReactPointerEvent } from 'react';

// Строка таблицы/карточка заказа перетаскивается целиком (без отдельной
// ручки — раньше два набора точек в строке расширяли её и вызывали
// горизонтальный скролл, задача 14.08.2026). Чтобы клики по кнопкам
// (RowActions ⋮, StatusQuickChange), ссылкам (ТРЦ, «Редактировать») и
// фото не запускали drag, PointerSensor игнорирует нажатия, начавшиеся на
// интерактивных элементах.
const INTERACTIVE_SELECTOR = 'button, a, input, select, textarea';

function isInteractiveTarget(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(INTERACTIVE_SELECTOR) !== null;
}

export class RowDragSensor extends PointerSensor {
  static activators = [
    {
      eventName: 'onPointerDown' as const,
      handler: ({ nativeEvent: event }: ReactPointerEvent, { onActivation }: PointerSensorOptions) => {
        if (!event.isPrimary || event.button !== 0 || isInteractiveTarget(event.target)) {
          return false;
        }

        onActivation?.({ event });
        return true;
      },
    },
  ];
}
