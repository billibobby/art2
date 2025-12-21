/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/renderer/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Discord/Cursor-inspired dark theme
        'dark-bg': '#1e1e1e',
        'dark-sidebar': '#2b2b2b',
        'dark-hover': '#3a3a3a',
        'dark-border': '#404040',
        'accent-blue': '#5865f2',
        'accent-green': '#3ba55d',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}