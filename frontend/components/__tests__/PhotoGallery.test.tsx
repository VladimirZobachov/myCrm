import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import PhotoGallery from '@/components/PhotoGallery';
import { Photo } from '@/lib/api';

describe('PhotoGallery', () => {
  it('рендерит миниатюры для новых фото (photos)', () => {
    const photos: Photo[] = [
      { id: 1, url: 'https://example.test/a.jpg' },
      { id: 2, url: 'https://example.test/b.jpg' },
    ];
    render(<PhotoGallery photos={photos} legacyPhoto="" />);

    const thumbs = screen.getAllByTestId('photo-thumb');
    expect(thumbs.length).toBe(2);
    expect(screen.getAllByRole('img', { name: 'Фото заказа' }).length).toBe(2);
  });

  it('парсит legacy-строку (ссылки через пробел, "-" игнорируется)', () => {
    render(
      <PhotoGallery
        photos={[]}
        legacyPhoto="https://example.test/legacy1.jpg https://example.test/legacy2.jpg -"
      />
    );

    expect(screen.getAllByTestId('photo-thumb').length).toBe(2);
  });

  it('объединяет новые фото и legacy-ссылки в одну галерею', () => {
    const photos: Photo[] = [{ id: 5, url: 'https://example.test/new.jpg' }];
    render(<PhotoGallery photos={photos} legacyPhoto="https://example.test/legacy.jpg" />);

    expect(screen.getAllByTestId('photo-thumb').length).toBe(2);
  });

  it('клик по миниатюре открывает лайтбокс с полным фото', () => {
    const photos: Photo[] = [{ id: 1, url: 'https://example.test/full.jpg' }];
    render(<PhotoGallery photos={photos} legacyPhoto="" />);

    expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();

    fireEvent.click(screen.getByTestId('photo-thumb'));

    expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();
    expect(screen.getAllByRole('img', { name: 'Фото заказа' }).length).toBe(2); // миниатюра + лайтбокс
  });

  it('закрытие лайтбокса по клику на крестик', () => {
    const photos: Photo[] = [{ id: 1, url: 'https://example.test/full.jpg' }];
    render(<PhotoGallery photos={photos} legacyPhoto="" />);

    fireEvent.click(screen.getByTestId('photo-thumb'));
    expect(screen.getByTestId('photo-lightbox')).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('photo-lightbox-close'));
    expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
  });

  it('закрытие лайтбокса по клику на фон', () => {
    const photos: Photo[] = [{ id: 1, url: 'https://example.test/full.jpg' }];
    render(<PhotoGallery photos={photos} legacyPhoto="" />);

    fireEvent.click(screen.getByTestId('photo-thumb'));
    fireEvent.click(screen.getByTestId('photo-lightbox'));
    expect(screen.queryByTestId('photo-lightbox')).not.toBeInTheDocument();
  });

  it('пустой список фото — заглушка, без миниатюр', () => {
    render(<PhotoGallery photos={[]} legacyPhoto="" />);

    expect(screen.getByTestId('photo-gallery-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('photo-thumb')).not.toBeInTheDocument();
  });

  it('пустой список фото и legacy-строка "-" — заглушка', () => {
    render(<PhotoGallery photos={[]} legacyPhoto="-" />);
    expect(screen.getByTestId('photo-gallery-empty')).toBeInTheDocument();
  });

  it('компактный режим с max ограничивает число миниатюр и показывает "+N"', () => {
    const photos: Photo[] = [
      { id: 1, url: 'https://example.test/a.jpg' },
      { id: 2, url: 'https://example.test/b.jpg' },
      { id: 3, url: 'https://example.test/c.jpg' },
      { id: 4, url: 'https://example.test/d.jpg' },
    ];
    render(<PhotoGallery photos={photos} legacyPhoto="" variant="compact" max={3} />);

    expect(screen.getAllByTestId('photo-thumb').length).toBe(3);
    expect(screen.getByTestId('photo-gallery-overflow')).toHaveTextContent('+1');
  });
});
