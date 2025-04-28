/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./public/index.html"
  ],
  darkMode: 'class', // Enable dark mode with class strategy
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#4dabf7',
          DEFAULT: '#228be6',
          dark: '#1971c2',
          darker: '#1864ab'
        },
        secondary: {
          light: '#f783ac',
          DEFAULT: '#e64980',
          dark: '#d6336c',
        },
        dark: {
          bg: '#121212',
          card: '#1e1e1e',
          light: '#2d2d2d',
          border: '#383838',
          text: '#e0e0e0',
        },
        light: {
          bg: '#f8f9fa',
          card: '#ffffff',
          border: '#e5e7eb',
          text: '#1f2937',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        }
      },
      boxShadow: {
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px rgba(31, 38, 135, 0.15)',
        'neon': '0 0 5px theme("colors.primary.DEFAULT"), 0 0 20px theme("colors.primary.light")',
      },
    },
  },
  plugins: [],
}