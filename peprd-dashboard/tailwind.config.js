/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fef5ec',
          100: '#fce4c8',
          500: '#e08a3a',
          600: '#b4560a',
          700: '#8b3f06',
        },
      },
    },
  },
  plugins: [],
};
