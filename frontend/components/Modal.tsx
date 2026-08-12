'use client';

/**
 * Общая обёртка для модалок: на мобильном — Drawer (выезжает снизу,
 * скруглены только верхние углы, safe-area отступ снизу под thumb-зону),
 * от sm (640px) и шире — центрированный диалог (как раньше).
 */
export default function Modal({
  onClose,
  children,
  maxWidth = 'sm:max-w-sm',
}: {
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 sm:p-4"
      onClick={onClose}
    >
      <div
        className={`w-full ${maxWidth} max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white shadow-xl pb-[env(safe-area-inset-bottom)] sm:pb-0`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
