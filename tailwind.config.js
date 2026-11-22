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
        // Binance Design System Tokens (from DESIGN.md)
        binance: {
          yellow: '#fcd535',
          'yellow-active': '#f0b90b',
          'yellow-disabled': '#3a3a1f',
          ink: '#181a20',
          'canvas-dark': '#0b0e11',
          'canvas-light': '#ffffff',
          'card-dark': '#1e2329',
          'elevated-dark': '#2b3139',
          'soft-light': '#fafafa',
          'strong-light': '#f5f5f5',
          'hairline-dark': '#2b3139',
          'hairline-light': '#eaecef',
          'border-strong': '#cdd1d6',
          'body-dark': '#eaecef',
          'body-light': '#181a20',
          muted: '#707a8a',
          'muted-strong': '#929aa5',
          'trading-up': '#0ecb81',
          'trading-down': '#f6465d',
          turquoise: '#2dbdb6',
          info: '#3b82f6',
        },
        // VaultDesk brand palette mapped to Binance Yellow
        vault: {
          50:  '#fffde6',
          100: '#fef9be',
          200: '#fef188',
          300: '#fde54d',
          400: '#fcd535',
          500: '#fcd535',
          600: '#f0b90b',
          700: '#d9a206',
          800: '#9b7305',
          900: '#5c4503',
          950: '#3a3a1f'
        },
        // Surface hierarchy mapped to Binance dark & elevated planes
        surface: {
          DEFAULT: '#0b0e11',
          50:  '#2b3139',
          100: '#1e2329',
          200: '#14181d',
          300: '#0b0e11'
        }
      },
      borderRadius: {
        xs: '2px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '12px',
        pill: '9999px'
      },
      fontFamily: {
        sans: ['BinanceNova', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['BinancePlex', 'JetBrains Mono', 'Fira Code', 'monospace']
      },
      animation: {
        'fade-in':    'fadeIn 0.2s ease-out',
        'slide-in':   'slideIn 0.25s ease-out',
        'slide-up':   'slideUp 0.2s ease-out',
        'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4,0,0.6,1) infinite'
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' },                                to: { opacity: '1' } },
        slideIn:   { from: { opacity: '0', transform: 'translateX(-8px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(8px)' },  to: { opacity: '1', transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.7' } }
      },
      boxShadow: {
        'focus-yellow': '0 0 0 2px rgba(252, 213, 53, 0.4)',
        'focus-blue':   '0 0 0 2px rgba(59, 130, 246, 0.5)',
        'card-dark':    '0 2px 8px rgba(0, 0, 0, 0.3)',
        'glass':        '0 8px 30px rgba(0, 0, 0, 0.5)'
      }
    }
  },
  plugins: []
}
