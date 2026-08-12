'use client';

import { useState } from 'react';
import { Order, Photo, api } from '@/lib/api';
import { TRC_OPTIONS, WHERE_OPTIONS, IMPORTANCE_OPTIONS } from '@/lib/constants';
import PhotoUploader, { PhotoUploadStatus } from '@/components/PhotoUploader';

/**
 * Форма заявки (1:1 с legacy fillFormData), раскладка — по new-order.png/edit-order.png:
 * левая колонка — Дата монтажа, ТРЦ (радио), Где печать (радио);
 * правая колонка — Монтажник, Вид работ, Бренд, Фотопривязка, Стоимость(+адм.), Важность (радио).
 * - price_admin, created_for — только админ (type_user=1)
 */
export default function OrderForm({
  role,
  order,
  onSaved,
  onCancel,
  mounters = [],
}: {
  role: number;
  order?: Order;
  onSaved: (o: Order) => void;
  onCancel?: () => void;
  mounters?: { id: number; fio: string }[];
}) {
  const isEdit = Boolean(order);
  const [form, setForm] = useState({
    trc: order?.trc ?? '',
    trc_other: order?.trc_other ?? '',
    date: order?.date ?? '',
    type_work: order?.type_work ?? '',
    brand: order?.brand ?? '',
    where_print: order?.where_print ?? '',
    where_other: order?.where_other ?? '',
    photo: order?.photo ?? '',
    price: order?.price ?? '',
    price_admin: order?.price_admin ?? '',
    importance: order?.importance ?? '',
    importance_other: order?.importance_other ?? '',
    created_for: order?.created_for?.id ? String(order.created_for.id) : '',
  });
  const [photos, setPhotos] = useState<Photo[]>(order?.photos ?? []);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  // Статус загрузки — по ссылке на File (индексы pendingFiles «плывут» при удалении/ретрае).
  const [uploadStatus, setUploadStatus] = useState<Map<File, PhotoUploadStatus>>(new Map());
  const [savedOrderId, setSavedOrderId] = useState<number | undefined>(order?.id);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Живой пересчёт price_admin (legacy: jQuery .on(input) → price*0.7)
  // Показываем только если price числовой, role=админ и price_admin не заполнен
  const numericPrice = form.price !== '' && !isNaN(Number(form.price));
  const showPriceHint =
    role === 1 && numericPrice && !isEdit && !form.price_admin;
  const priceHint = numericPrice ? Math.round(Number(form.price) * 0.7) : null;

  function set<K extends keyof typeof form>(key: K, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  // Грузит один файл и сразу переносит его из очереди в photos при успехе.
  // При ошибке файл остаётся в pendingFiles со статусом 'error' — для retry.
  async function uploadOneFile(orderId: number, file: File): Promise<boolean> {
    setUploadStatus((s) => new Map(s).set(file, { status: 'uploading', progress: 0 }));
    try {
      const photo = await api.uploadPhoto(orderId, file, (progress) => {
        setUploadStatus((s) => new Map(s).set(file, { status: 'uploading', progress }));
      });
      setPhotos((ps) => [...ps, photo]);
      setPendingFiles((fs) => fs.filter((f) => f !== file));
      setUploadStatus((s) => {
        const next = new Map(s);
        next.delete(file);
        return next;
      });
      return true;
    } catch (err) {
      setUploadStatus((s) =>
        new Map(s).set(file, {
          status: 'error',
          progress: 0,
          error: err instanceof Error ? err.message : 'Ошибка загрузки',
        })
      );
      return false;
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      const saved = order
        ? await api.updateOrder(order.id, payload)
        : await api.createOrder(payload);
      setSavedOrderId(saved.id);

      // Файлы грузятся после того, как у заказа точно есть id
      // (при создании — только что созданного).
      if (pendingFiles.length > 0) {
        const results = await Promise.all(
          pendingFiles.map((file) => uploadOneFile(saved.id, file))
        );
        if (results.some((ok) => !ok)) {
          // Заказ уже сохранён — не уходим со страницы, чтобы не потерять
          // неудачные фото и не создать заказ повторно. Повтор — кнопкой «Повторить».
          setError('Часть фото не загрузилась. Повторите загрузку отмеченных файлов.');
          return;
        }
      }

      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  function handleRetryUpload(file: File) {
    if (!savedOrderId) return;
    uploadOneFile(savedOrderId, file);
  }

  function handleFilesAdd(files: File[]) {
    setPendingFiles((fs) => [...fs, ...files]);
  }

  function handlePendingRemove(index: number) {
    setPendingFiles((fs) => {
      const removed = fs[index];
      if (removed) {
        setUploadStatus((s) => {
          if (!s.has(removed)) return s;
          const next = new Map(s);
          next.delete(removed);
          return next;
        });
      }
      return fs.filter((_, i) => i !== index);
    });
  }

  async function handleExistingDelete(photoId: number) {
    try {
      await api.deletePhoto(photoId);
      setPhotos((ps) => ps.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка удаления фото');
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-blue-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';
  const radioRowCls = 'flex items-center gap-2 min-h-[44px] text-sm text-slate-700';

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-10 gap-y-6">
        {/* Левая колонка */}
        <div className="space-y-6">
          <div>
            <label htmlFor="date" className={labelCls}>Дата монтажа *</label>
            <input
              id="date"
              type="date"
              value={form.date}
              onChange={(e) => set('date', e.target.value)}
              className={inputCls}
              required
            />
          </div>

          {/* ТРЦ */}
          <fieldset>
            <legend className={labelCls}>ТРЦ *</legend>
            <div className="space-y-0.5">
              {TRC_OPTIONS.map((opt) => (
                <label key={opt} className={radioRowCls}>
                  <input
                    type="radio"
                    name="trc"
                    value={opt}
                    checked={form.trc === opt}
                    onChange={(e) => set('trc', e.target.value)}
                    className="accent-blue-600 size-4"
                  />
                  {opt}
                </label>
              ))}
            </div>
            {form.trc === 'Другое' && (
              <div className="mt-2">
                <label htmlFor="trc_other" className={labelCls}>Укажите ТРЦ *</label>
                <input
                  id="trc_other"
                  type="text"
                  value={form.trc_other}
                  onChange={(e) => set('trc_other', e.target.value)}
                  className={inputCls}
                  placeholder="Название ТРЦ"
                  required
                />
              </div>
            )}
          </fieldset>

          {/* Где печать */}
          <fieldset>
            <legend className={labelCls}>Где печать *</legend>
            <div className="space-y-0.5">
              {WHERE_OPTIONS.map((opt) => (
                <label key={opt} className={radioRowCls}>
                  <input
                    type="radio"
                    name="where_print"
                    value={opt}
                    checked={form.where_print === opt}
                    onChange={(e) => set('where_print', e.target.value)}
                    className="accent-blue-600 size-4"
                  />
                  {opt}
                </label>
              ))}
            </div>
            {form.where_print === 'Другое' && (
              <div className="mt-2">
                <label htmlFor="where_other" className={labelCls}>Укажите место печати *</label>
                <input
                  id="where_other"
                  type="text"
                  value={form.where_other}
                  onChange={(e) => set('where_other', e.target.value)}
                  className={inputCls}
                  placeholder="Название компании"
                  required
                />
              </div>
            )}
          </fieldset>
        </div>

        {/* Правая колонка */}
        <div className="space-y-6">
          {/* Монтажник — только админ */}
          {role === 1 && (
            <div>
              <label htmlFor="created_for" className={labelCls}>Монтажник</label>
              <select
                id="created_for"
                value={form.created_for}
                onChange={(e) => set('created_for', e.target.value)}
                className={inputCls}
              >
                <option value="">Выберите монтажника</option>
                {mounters.map((m) => (
                  <option key={m.id} value={m.id}>{m.fio}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label htmlFor="type_work" className={labelCls}>Вид работ *</label>
            <textarea
              id="type_work"
              value={form.type_work}
              onChange={(e) => set('type_work', e.target.value)}
              rows={4}
              className={inputCls}
              placeholder="Что требуется сделать"
              required
            />
          </div>

          <div>
            <label htmlFor="brand" className={labelCls}>Бренд *</label>
            <input
              id="brand"
              type="text"
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
              className={inputCls}
              placeholder="Название бренда"
              required
            />
          </div>

          <div>
            <div className={labelCls}>Фотопривязка</div>
            <PhotoUploader
              photos={photos}
              pendingFiles={pendingFiles}
              uploadStatus={uploadStatus}
              onFilesAdd={handleFilesAdd}
              onPendingRemove={handlePendingRemove}
              onExistingDelete={handleExistingDelete}
              onRetry={handleRetryUpload}
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="price" className={labelCls}>Стоимость *</label>
              <input
                id="price"
                type="text"
                value={form.price}
                onChange={(e) => set('price', e.target.value)}
                className={inputCls}
                required
                placeholder="Руб."
              />
              {showPriceHint && priceHint !== null && (
                <p className="mt-1 text-xs text-blue-600">
                  price_admin = {priceHint} (авто: цена × 0.7)
                </p>
              )}
            </div>
            {role === 1 && (
              <div>
                <label htmlFor="price_admin" className={labelCls}>Стоимость адм.</label>
                <input
                  id="price_admin"
                  type="text"
                  value={form.price_admin}
                  onChange={(e) => set('price_admin', e.target.value)}
                  className={inputCls}
                  placeholder="Руб."
                />
              </div>
            )}
          </div>

          {/* Важность */}
          <fieldset>
            <legend className={labelCls}>Важность *</legend>
            <div className="space-y-0.5">
              {IMPORTANCE_OPTIONS.map((opt) => (
                <label key={opt} className={radioRowCls}>
                  <input
                    type="radio"
                    name="importance"
                    value={opt}
                    checked={form.importance === opt}
                    onChange={(e) => set('importance', e.target.value)}
                    className="accent-blue-600 size-4"
                  />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] px-5 rounded-lg border border-blue-600 text-blue-600 font-medium hover:bg-blue-50"
          >
            Отмена
          </button>
        )}
        <button
          type="submit"
          disabled={loading}
          className="min-h-[44px] px-5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium disabled:opacity-50 transition-colors"
        >
          {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
        </button>
      </div>
    </form>
  );
}
