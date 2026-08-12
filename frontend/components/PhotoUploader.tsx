'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Photo } from '@/lib/api';

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024; // 10MB, как на бэкенде (max:10240 Kb)

/**
 * Drag-n-drop загрузка фото к заявке.
 * Уже загруженные фото (photos) удаляются сразу через API (onExistingDelete).
 * Свежевыбранные файлы (pendingFiles) — очередь, реально грузятся при сабмите формы.
 */
export default function PhotoUploader({
  photos,
  pendingFiles,
  onFilesAdd,
  onPendingRemove,
  onExistingDelete,
  disabled = false,
}: {
  photos: Photo[];
  pendingFiles: File[];
  onFilesAdd: (files: File[]) => void;
  onPendingRemove: (index: number) => void;
  onExistingDelete: (photoId: number) => void;
  disabled?: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const previewUrls = useMemo(
    () => pendingFiles.map((file) => URL.createObjectURL(file)),
    [pendingFiles]
  );
  useEffect(() => {
    return () => previewUrls.forEach((url) => URL.revokeObjectURL(url));
  }, [previewUrls]);

  function validateAndAdd(fileList: FileList | File[]) {
    const files = Array.from(fileList);
    const valid: File[] = [];
    let rejected = '';
    for (const file of files) {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        rejected = 'Допустимые форматы: JPEG, PNG, WEBP';
        continue;
      }
      if (file.size > MAX_SIZE) {
        rejected = 'Максимальный размер файла — 10MB';
        continue;
      }
      valid.push(file);
    }
    setError(rejected);
    if (valid.length) onFilesAdd(valid);
  }

  function handleDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragOver(false);
    if (disabled || !e.dataTransfer.files?.length) return;
    validateAndAdd(e.dataTransfer.files);
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) validateAndAdd(e.target.files);
    e.target.value = '';
  }

  return (
    <div className="space-y-3" data-testid="photo-uploader">
      <div
        data-testid="photo-dropzone"
        onDragOver={(e) => {
          e.preventDefault();
          if (!disabled) setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => !disabled && inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center text-sm cursor-pointer transition-colors ${
          dragOver ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-400'
        } ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <span className="text-slate-600">Перетащите фото сюда или нажмите, чтобы выбрать</span>
        <span className="text-xs text-slate-400">JPEG, PNG, WEBP до 10MB</span>
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          capture="environment"
          multiple
          disabled={disabled}
          onChange={handleInputChange}
          className="sr-only"
          aria-label="Добавить фото"
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {(photos.length > 0 || pendingFiles.length > 0) && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={`existing-${photo.id}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={photo.url} alt="Фото заказа" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onExistingDelete(photo.id)}
                aria-label="Удалить фото"
                disabled={disabled}
                className="absolute top-1 right-1 flex items-center justify-center size-6 rounded-full bg-black/60 text-white text-xs hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
          {pendingFiles.map((file, index) => (
            <div
              key={`pending-${index}-${file.name}`}
              className="relative aspect-square rounded-lg overflow-hidden border border-slate-200"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={previewUrls[index]} alt={file.name} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onPendingRemove(index)}
                aria-label="Удалить фото"
                disabled={disabled}
                className="absolute top-1 right-1 flex items-center justify-center size-6 rounded-full bg-black/60 text-white text-xs hover:bg-red-600"
              >
                ×
              </button>
              <span className="absolute bottom-0 inset-x-0 bg-black/50 text-white text-[10px] text-center py-0.5">
                Не загружено
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
