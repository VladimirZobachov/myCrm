import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// localStorage mock для jsdom
if (typeof window !== 'undefined') {
  const store: Record<string, string> = {};
  window.localStorage = {
    getItem: (k: string) => store[k] ?? null,
    setItem: (k: string, v: string) => { store[k] = String(v); },
    removeItem: (k: string) => { delete store[k]; },
    clear: () => { Object.keys(store).forEach((k) => delete store[k]); },
    key: (i: number) => Object.keys(store)[i] ?? null,
    get length() { return Object.keys(store).length; },
  };
}

// fetch mock
global.fetch = vi.fn() as unknown as typeof fetch;

// jsdom не реализует createObjectURL/revokeObjectURL — нужны для превью фото
if (typeof window !== 'undefined') {
  if (!window.URL.createObjectURL) {
    window.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
  }
  if (!window.URL.revokeObjectURL) {
    window.URL.revokeObjectURL = vi.fn();
  }
}
