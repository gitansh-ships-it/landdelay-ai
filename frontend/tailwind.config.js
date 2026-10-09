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
        serene: {
          bg: '#EAF6FF',
          secondary: '#DDEFFF',
          accent: '#1687E8',
          deep: '#1264B3',
          text: '#18344D',
          muted: '#607D95',
          border: 'rgba(255, 255, 255, 0.78)',
          glass: 'rgba(255, 255, 255, 0.55)',
          glassElevated: 'rgba(255, 255, 255, 0.72)',
          surface: 'rgba(255, 255, 255, 0.90)',
          darkBg: '#0B1522',
          darkSecondary: '#101F30',
          darkGlass: 'rgba(24, 43, 63, 0.75)',
          darkElevated: 'rgba(31, 54, 77, 0.88)',
          darkText: '#EDF6FF',
          darkMuted: '#A8BED2',
          darkAccent: '#56B4F5',
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
        'glass': '0 8px 32px 0 rgba(18, 100, 179, 0.08)',
        'glass-hover': '0 12px 36px 0 rgba(18, 100, 179, 0.14)',
        'glass-lg': '0 16px 48px 0 rgba(18, 100, 179, 0.16)',
        'glass-inner': 'inset 0 1px 1px 0 rgba(255, 255, 255, 0.85)',
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
