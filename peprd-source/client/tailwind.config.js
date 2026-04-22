/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // PepRD palette (matches peprd.io)
        cream: { DEFAULT: '#f6f3ec', soft: '#efeadf' },
        teal: { 500: '#2d5f5a', 600: '#244e4a', 700: '#1f4340' },
        gold: { 400: '#e3bf65', 500: '#c89b3c' },
        navy: '#1a2332',
        danger: '#b44545',
        // Back-compat aliases (some pages reference bg-primary/secondary)
        'bg-primary': '#1a2332',
        'bg-secondary': '#1f4340',
        'bg-tertiary': '#2d5f5a',
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        serif:   ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Instrument Sans', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      animation: {
        shimmer: 'shimmer 2s infinite',
      },
      keyframes: {
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
    },
  },
  plugins: [],
}
