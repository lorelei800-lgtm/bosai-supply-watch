/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['system-ui', 'Hiragino Sans', 'Yu Gothic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
