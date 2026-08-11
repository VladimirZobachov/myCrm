'use client';

import { useState } from 'react';
import { Order, api } from '@/lib/api';
import { TRC_OPTIONS, WHERE_OPTIONS, IMPORTANCE_OPTIONS } from '@/lib/constants';

/**
 * Форма заявки (1:1 с legacy fillFormData):
 * - trc (radio) + trc_other (если «Другое»)
 * - date, type_work, brand, where_print + where_other, photo, price
 * - price_admin — только админ (type_user=1)
 * - importance + importance_other
 * - created_for (select монтажников) — только админ
 */
export default function OrderForm({
  role,
  order,
  onSaved,
  mounters = [],
}: {
  role: number;
  order?: Order;
  onSaved: (o: Order) => void;
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

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (order) {
        const saved = await api.updateOrder(order.id, payload);
        onSaved(saved);
      } else {
        const saved = await api.createOrder(payload);
        onSaved(saved);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  const inputCls =
    'w-full rounded-lg border border-slate-300 px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const labelCls = 'block text-sm font-medium text-slate-700 mb-1';

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm">{error}</div>}

      {/* ТРЦ */}
      <fieldset>
        <legend className={labelCls}>ТРЦ *</legend>
        <div className="flex flex-wrap gap-2">
          {TRC_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="radio"
                name="trc"
                value={opt}
                checked={form.trc === opt}
                onChange={(e) => set('trc', e.target.value)}
                className="accent-indigo-600"
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
              required
            />
          </div>
        )}
      </fieldset>

      {/* Дата монтажа */}
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

      {/* Вид работ */}
      <div>
        <label htmlFor="type_work" className={labelCls}>Вид работ *</label>
        <textarea
          id="type_work"
          value={form.type_work}
          onChange={(e) => set('type_work', e.target.value)}
          rows={3}
          className={inputCls}
          required
        />
      </div>

      {/* Бренд */}
      <div>
        <label htmlFor="brand" className={labelCls}>Бренд *</label>
        <input
          id="brand"
          type="text"
          value={form.brand}
          onChange={(e) => set('brand', e.target.value)}
          className={inputCls}
          required
        />
      </div>

      {/* Где печать */}
      <fieldset>
        <legend className={labelCls}>Где печать *</legend>
        <div className="flex flex-wrap gap-2">
          {WHERE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="radio"
                name="where_print"
                value={opt}
                checked={form.where_print === opt}
                onChange={(e) => set('where_print', e.target.value)}
                className="accent-indigo-600"
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
              required
            />
          </div>
        )}
      </fieldset>

      {/* Фотопривязка */}
      <div>
        <label htmlFor="photo" className={labelCls}>Фотопривязка (ссылки через пробел)</label>
        <textarea
          id="photo"
          value={form.photo}
          onChange={(e) => set('photo', e.target.value)}
          rows={2}
          className={inputCls}
        />
      </div>

      {/* Стоимость */}
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
            placeholder="напр. 5000 или «По факту»"
          />
          {showPriceHint && priceHint !== null && (
            <p className="mt-1 text-xs text-indigo-600">
              price_admin = {priceHint} (авто: цена × 0.7)
            </p>
          )}
        </div>
        {role === 1 && (
          <div>
            <label htmlFor="price_admin" className={labelCls}>Стоимость адм. *</label>
            <input
              id="price_admin"
              type="text"
              value={form.price_admin}
              onChange={(e) => set('price_admin', e.target.value)}
              className={inputCls}
            />
          </div>
        )}
      </div>

      {/* Важность */}
      <fieldset>
        <legend className={labelCls}>Важность *</legend>
        <div className="flex flex-wrap gap-2">
          {IMPORTANCE_OPTIONS.map((opt) => (
            <label key={opt} className="flex items-center gap-1.5 text-sm text-slate-700">
              <input
                type="radio"
                name="importance"
                value={opt}
                checked={form.importance === opt}
                onChange={(e) => set('importance', e.target.value)}
                className="accent-indigo-600"
              />
              {opt}
            </label>
          ))}
        </div>
      </fieldset>

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
            <option value="">— не назначен —</option>
            {mounters.map((m) => (
              <option key={m.id} value={m.id}>{m.fio}</option>
            ))}
          </select>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg py-2.5 min-h-[44px] disabled:opacity-50 transition-colors"
      >
        {loading ? 'Сохранение...' : isEdit ? 'Сохранить' : 'Добавить'}
      </button>
    </form>
  );
}
