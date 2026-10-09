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
          50: '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        navy: {
          800: '#1e293b',
          900: '#0f172a',
          950: '#090d16',
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
      }
    },
  },
  plugins: [],
}
