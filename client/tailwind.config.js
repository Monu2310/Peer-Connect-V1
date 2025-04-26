/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4dabf7',
          DEFAULT: '#228be6',
          dark: '#1971c2',
        },
        secondary: {
          light: '#f783ac',
          DEFAULT: '#e64980',
          dark: '#d6336c',
        },
      }
    },
  },
  plugins: [],
}