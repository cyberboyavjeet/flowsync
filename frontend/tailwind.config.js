/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        card: '#ffffff',
        primary: {
          DEFAULT: '#4f46e5',
          foreground: '#ffffff'
        },
        danger: {
          DEFAULT: '#ef4444',
          foreground: '#ffffff'
        },
        warning: {
          DEFAULT: '#f59e0b',
          foreground: '#ffffff'
        }
      }
    },
  },
  plugins: [],
}
