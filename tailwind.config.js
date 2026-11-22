/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './src/renderer/**/*.{js,ts,jsx,tsx,html}',
    './src/renderer/index.html'
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // VaultDesk brand palette
        vault: {
          50:  '#f0f4ff',
          100: '#e0e9ff',
          200: '#c7d6fe',
          300: '#a4b8fc',
          400: '#7c90f8',
          500: '#5B6CF9',
          600: '#4a52ee',
          700: '#3d41d8',
          800: '#3337ae',
          900: '#2e3289',
          950: '#1c1f52'
        },
        surface: {
          DEFAULT: '#0f1117',
          50:  '#1a1d2e',
          100: '#16192a',
          200: '#12152a',
          300: '#0f1117'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite'
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                        to: { opacity: '1' } },
        slideIn:   { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } }
      },
      boxShadow: {
        'vault':  '0 0 0 1px rgba(91,108,249,0.3), 0 4px 24px rgba(91,108,249,0.15)',
        'glass':  '0 4px 24px rgba(0,0,0,0.4)',
        'card':   '0 2px 8px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.05)'
      }
    }
  },
  plugins: []
}
