/**
 * Черновик tailwind.config.js для будущего Next.js-фронтенда MyCRM.
 * Значения смапплены 1:1 из docker/design/tokens.json — при изменении токенов
 * обновляй оба файла синхронно (пока нет автогенерации из tokens.json).
 */

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          DEFAULT: '#4f46e5',
        },
        neutral: {
          surface: '#ffffff',
          'surface-alt': '#f8fafc',
          'surface-sunken': '#f1f5f9',
          ink: '#0f172a',
          'ink-secondary': '#334155',
          muted: '#64748b',
          'muted-2': '#94a3b8',
          border: '#e2e8f0',
          'border-strong': '#cbd5e1',
        },
        success: { DEFAULT: '#16a34a', bg: '#f0fdf4', border: '#bbf7d0' },
        warning: { DEFAULT: '#d97706', bg: '#fffbeb', border: '#fde68a' },
        danger: { DEFAULT: '#dc2626', bg: '#fef2f2', border: '#fecaca' },
        info: { DEFAULT: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
      },

      fontFamily: {
        base: ['Inter', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },

      fontSize: {
        xs: ['12px', { lineHeight: '16px' }],
        sm: ['13px', { lineHeight: '18px' }],
        base: ['14px', { lineHeight: '20px' }],
        md: ['16px', { lineHeight: '24px' }],
        h4: ['18px', { lineHeight: '24px', fontWeight: '600' }],
        h3: ['20px', { lineHeight: '28px', fontWeight: '600' }],
        h2: ['24px', { lineHeight: '32px', fontWeight: '700' }],
        h1: ['30px', { lineHeight: '38px', fontWeight: '700' }],
      },

      fontWeight: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
      },

      spacing: {
        1: '4px',
        2: '8px',
        3: '12px',
        4: '16px',
        6: '24px',
        8: '32px',
        12: '48px',
      },

      borderRadius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
        full: '9999px',
      },

      boxShadow: {
        sm: '0 1px 2px rgba(15, 23, 42, 0.06)',
        md: '0 4px 8px rgba(15, 23, 42, 0.08), 0 1px 2px rgba(15, 23, 42, 0.06)',
        lg: '0 12px 24px rgba(15, 23, 42, 0.12), 0 4px 8px rgba(15, 23, 42, 0.06)',
      },

      transitionDuration: {
        fast: '100ms',
        normal: '180ms',
        slow: '280ms',
      },

      transitionTimingFunction: {
        standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
        emphasized: 'cubic-bezier(0.2, 0, 0, 1)',
      },
    },
  },
  plugins: [],
}
