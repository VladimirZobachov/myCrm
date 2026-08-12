'use client';

import { useState } from 'react';
import { Photo } from '@/lib/api';

interface GalleryPhoto {
  key: string;
  url: string;
}

// Объединяет новые фото (photos, задача #52) с legacy-строкой (photo —
// ссылки через пробел, "-" означает "нет фото").
export function mergePhotos(photos: Photo[] = [], legacyPhoto = ''): GalleryPhoto[] {
  const legacyUrls = legacyPhoto.split(/\s+/).filter((p) => p && p !== '-');
  return [
    ...photos.map((p) => ({ key: `p-${p.id}`, url: p.url })),
    ...legacyUrls.map((url, i) => ({ key: `legacy-${i}`, url })),
  ];
}

/**
 * Галерея фото заявки: миниатюры сеткой + лайтбокс с полным фото по клику.
 * variant="compact" — узкий ряд миниатюр (таблица/мобильные карточки),
 * variant="grid" — полная сетка (карточка заказа).
 */
export default function PhotoGallery({
  photos = [],
  legacyPhoto = '',
  variant = 'grid',
  max,
}: {
  photos?: Photo[];
  legacyPhoto?: string;
  variant?: 'grid' | 'compact';
  max?: number;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const all = mergePhotos(photos, legacyPhoto);

  if (all.length === 0) {
    return (
      <span className="text-slate-300" data-testid="photo-gallery-empty">
        —
      </span>
    );
  }

  const visible = max != null ? all.slice(0, max) : all;
  const overflow = max != null && all.length > max ? all.length - max : 0;

  const containerCls = variant === 'compact' ? 'flex items-center gap-1' : 'grid grid-cols-3 sm:grid-cols-4 gap-3';
  const thumbCls = variant === 'compact' ? 'size-10 rounded-md' : 'aspect-square rounded-lg';

  return (
    <>
      <div className={containerCls} data-testid="photo-gallery">
        {visible.map((photo, i) => (
          <button
            key={photo.key}
            type="button"
            onClick={() => setOpenIndex(i)}
            aria-label="Открыть фото"
            data-testid="photo-thumb"
            className={`relative ${thumbCls} overflow-hidden border border-slate-200 shrink-0`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt="Фото заказа" className="w-full h-full object-cover" />
          </button>
        ))}
        {overflow > 0 && (
          <span
            data-testid="photo-gallery-overflow"
            className={`flex items-center justify-center ${thumbCls} bg-slate-100 text-slate-500 text-xs font-medium shrink-0`}
          >
            +{overflow}
          </span>
        )}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          data-testid="photo-lightbox"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            aria-label="Закрыть"
            data-testid="photo-lightbox-close"
            className="absolute top-4 right-4 flex items-center justify-center size-9 rounded-full bg-white/10 text-white text-xl hover:bg-white/20"
          >
            ×
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={visible[openIndex].url}
            alt="Фото заказа"
            className="max-w-full max-h-full rounded-lg object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
