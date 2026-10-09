/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f0f7ff',
          100: '#e0edfe',
          200: '#bae0fd',
          300: '#7cc4fa',
          400: '#38a4f6',
          500: '#0f85ea',
          600: '#0267c7',
          700: '#0352a1',
          800: '#074584',
          900: '#0b3b6e',
          950: '#072549',
        },
        navy: {
          800: '#152238',
          900: '#0b1324',
          950: '#060a14',
        },
        risk: {
          high: '#ef4444',
          'high-bg': '#fef2f2',
          'high-border': '#fecaca',
          medium: '#f59e0b',
          'medium-bg': '#fffbeb',
          'medium-border': '#fde68a',
          low: '#10b981',
          'low-bg': '#ecfdf5',
          'low-border': '#a7f3d0',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'glass': '0 8px 32px 0 rgba(31, 38, 135, 0.08)',
        'glass-hover': '0 12px 36px 0 rgba(31, 38, 135, 0.14)',
        'glass-lg': '0 16px 48px 0 rgba(31, 38, 135, 0.16)',
        'glass-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.7)',
        'glass-dark': '0 8px 32px 0 rgba(0, 0, 0, 0.45)',
        'glass-dark-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.08)',
      },
      backdropBlur: {
        'xs': '2px',
        'glass': '16px',
        'glass-heavy': '24px',
      }
    },
  },
  plugins: [],
}
