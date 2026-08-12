import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoUploader, { PhotoUploadStatus } from '@/components/PhotoUploader';
import { Photo } from '@/lib/api';

function makeFile(name: string, type: string, size = 1024): File {
  const file = new File(['a'.repeat(size)], name, { type });
  return file;
}

describe('PhotoUploader', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('рендерит зону перетаскивания и подсказку по форматам', () => {
    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[]}
        onFilesAdd={() => {}}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );
    expect(screen.getByTestId('photo-dropzone')).toBeInTheDocument();
    expect(screen.getByText(/JPEG, PNG, WEBP/i)).toBeInTheDocument();
  });

  it('выбор валидного файла через input вызывает onFilesAdd', () => {
    const onFilesAdd = vi.fn();
    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[]}
        onFilesAdd={onFilesAdd}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    const input = screen.getByLabelText('Добавить фото') as HTMLInputElement;
    const file = makeFile('photo.jpg', 'image/jpeg');
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdd).toHaveBeenCalledWith([file]);
  });

  it('отклоняет недопустимый тип файла и не вызывает onFilesAdd', () => {
    const onFilesAdd = vi.fn();
    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[]}
        onFilesAdd={onFilesAdd}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    const input = screen.getByLabelText('Добавить фото') as HTMLInputElement;
    const file = makeFile('doc.txt', 'text/plain');
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/Допустимые форматы/i)).toBeInTheDocument();
  });

  it('отклоняет файл больше 10MB', () => {
    const onFilesAdd = vi.fn();
    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[]}
        onFilesAdd={onFilesAdd}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    const input = screen.getByLabelText('Добавить фото') as HTMLInputElement;
    const file = makeFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024);
    fireEvent.change(input, { target: { files: [file] } });

    expect(onFilesAdd).not.toHaveBeenCalled();
    expect(screen.getByText(/Максимальный размер файла/i)).toBeInTheDocument();
  });

  it('drag-n-drop файла вызывает onFilesAdd', () => {
    const onFilesAdd = vi.fn();
    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[]}
        onFilesAdd={onFilesAdd}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    const file = makeFile('photo.png', 'image/png');
    const dropzone = screen.getByTestId('photo-dropzone');
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });

    expect(onFilesAdd).toHaveBeenCalledWith([file]);
  });

  it('показывает превью существующих и ожидающих загрузки фото', () => {
    const photos: Photo[] = [{ id: 1, url: 'https://example.test/photo1.jpg' }];
    const pendingFiles = [makeFile('new.jpg', 'image/jpeg')];

    render(
      <PhotoUploader
        photos={photos}
        pendingFiles={pendingFiles}
        onFilesAdd={() => {}}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    const images = screen.getAllByRole('img');
    expect(images).toHaveLength(2);
    expect(screen.getByText('Не загружено')).toBeInTheDocument();
  });

  it('удаление существующего фото вызывает onExistingDelete с id', () => {
    const onExistingDelete = vi.fn();
    const photos: Photo[] = [{ id: 7, url: 'https://example.test/photo7.jpg' }];

    render(
      <PhotoUploader
        photos={photos}
        pendingFiles={[]}
        onFilesAdd={() => {}}
        onPendingRemove={() => {}}
        onExistingDelete={onExistingDelete}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Удалить фото' }));
    expect(onExistingDelete).toHaveBeenCalledWith(7);
  });

  it('удаление ожидающего файла вызывает onPendingRemove с индексом', () => {
    const onPendingRemove = vi.fn();
    const pendingFiles = [makeFile('a.jpg', 'image/jpeg'), makeFile('b.jpg', 'image/jpeg')];

    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={pendingFiles}
        onFilesAdd={() => {}}
        onPendingRemove={onPendingRemove}
        onExistingDelete={() => {}}
      />
    );

    const deleteButtons = screen.getAllByRole('button', { name: 'Удалить фото' });
    fireEvent.click(deleteButtons[1]);
    expect(onPendingRemove).toHaveBeenCalledWith(1);
  });

  it('показывает прогресс-бар и проценты во время загрузки', () => {
    const file = makeFile('uploading.jpg', 'image/jpeg');
    const uploadStatus = new Map<File, PhotoUploadStatus>([
      [file, { status: 'uploading', progress: 42 }],
    ]);

    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[file]}
        uploadStatus={uploadStatus}
        onFilesAdd={() => {}}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    expect(screen.getByText(/Загрузка…\s*42%/)).toBeInTheDocument();
    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('aria-valuenow', '42');
    // Пока файл грузится, удалить его нельзя (чтобы не оторвать XHR от UI)
    expect(screen.getByRole('button', { name: 'Удалить фото' })).toBeDisabled();
  });

  it('при ошибке показывает «Не загружено» и кнопку «Повторить»', () => {
    const file = makeFile('failed.jpg', 'image/jpeg');
    const uploadStatus = new Map<File, PhotoUploadStatus>([
      [file, { status: 'error', progress: 0, error: 'Ошибка сети' }],
    ]);

    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[file]}
        uploadStatus={uploadStatus}
        onFilesAdd={() => {}}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
        onRetry={() => {}}
      />
    );

    expect(screen.getByText('Не загружено')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Повторить' })).toBeInTheDocument();
  });

  it('клик по «Повторить» вызывает onRetry с тем же файлом (без дубля в очереди)', () => {
    const file = makeFile('failed.jpg', 'image/jpeg');
    const uploadStatus = new Map<File, PhotoUploadStatus>([
      [file, { status: 'error', progress: 0, error: 'Ошибка сети' }],
    ]);
    const onRetry = vi.fn();
    const onFilesAdd = vi.fn();

    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[file]}
        uploadStatus={uploadStatus}
        onFilesAdd={onFilesAdd}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
        onRetry={onRetry}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Повторить' }));

    expect(onRetry).toHaveBeenCalledTimes(1);
    expect(onRetry).toHaveBeenCalledWith(file);
    // Повтор — это не «добавление файла»: очередь не должна расти
    expect(onFilesAdd).not.toHaveBeenCalled();
    expect(screen.getAllByRole('img')).toHaveLength(1);
  });

  it('успешно загруженный файл показывает «Загружено» без кнопки «Повторить»', () => {
    const file = makeFile('done.jpg', 'image/jpeg');
    const uploadStatus = new Map<File, PhotoUploadStatus>([
      [file, { status: 'done', progress: 100 }],
    ]);

    render(
      <PhotoUploader
        photos={[]}
        pendingFiles={[file]}
        uploadStatus={uploadStatus}
        onFilesAdd={() => {}}
        onPendingRemove={() => {}}
        onExistingDelete={() => {}}
      />
    );

    expect(screen.getByText('Загружено')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Повторить' })).not.toBeInTheDocument();
  });
});
