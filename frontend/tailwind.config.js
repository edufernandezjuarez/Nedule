/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        surface: {
          DEFAULT: '#0d0d0d',
          alt: '#1c1c1c',
        },
        content: {
          DEFAULT: '#f0f0ee',
          muted: '#8c8c8a',
        },
        accent: '#378add',
      },
    },
  },
  plugins: [],
};
