/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel', 'serif'],
        inter: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      colors: {
        background: {
          base: '#0a0a0a',
          surface: '#1c1917',
          overlay: '#292524',
        },
        primary: {
          DEFAULT: '#fbbf24',
          dark: '#f59e0b',
        },
        secondary: {
          DEFAULT: '#a855f7',
        },
        accent: {
          DEFAULT: '#ef4444',
        },
        text: {
          primary: '#fafaf9',
          secondary: '#a8a29e',
          muted: '#57534e',
        },
        stone: {
          750: '#44403c',
          850: '#292524',
          950: '#0c0a09',
        },
      },
      boxShadow: {
        'gold-glow': '0 0 20px rgba(251, 191, 36, 0.5)',
        'purple-glow': '0 0 20px rgba(168, 85, 247, 0.5)',
        'red-glow': '0 0 20px rgba(239, 68, 68, 0.5)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
    },
  },
  plugins: [],
}