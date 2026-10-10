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
        canvas: {
          light: '#F5F7FA',
          dark: '#0B1320',
        },
        surface: {
          light: '#FFFFFF',
          dark: '#121E31',
        },
        sidebar: {
          DEFAULT: '#101B2D',
          dark: '#0A111E',
          active: '#3563E9',
        },
        gov: {
          primary: '#3563E9',
          'primary-hover': '#2B52C6',
          border: '#E1E7EF',
          'border-dark': '#1F2E45',
          text: '#172033',
          'text-dark': '#F1F5F9',
          muted: '#687386',
          'muted-dark': '#94A3B8',
        },
        risk: {
          high: '#DC3545',
          'high-bg': '#FEF2F2',
          'high-border': '#FECACA',
          medium: '#E9A23B',
          'medium-bg': '#FFFBEB',
          'medium-border': '#FDE68A',
          low: '#19966B',
          'low-bg': '#ECFDF5',
          'low-border': '#A7F3D0',
        }
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'sm': '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
