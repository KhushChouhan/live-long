/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./App.{js,jsx,ts,tsx}", 
    "./src/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        background: '#f8fafc',
        primary: '#3b82f6', // blue-500
        muted: '#f1f5f9', // slate-100
        border: '#e2e8f0', // slate-200
        card: '#ffffff',
        foreground: '#0f172a', // slate-900
        mutedForeground: '#64748b', // slate-500
      }
    },
  },
  plugins: [],
}
