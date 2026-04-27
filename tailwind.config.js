/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#e8f1ff',
          100: '#c8dcff',
          500: '#2563eb',
          700: '#1d4ed8',
          900: '#1e3a8a',
        },
        ink: {
          900: '#111827',
          700: '#374151',
          500: '#6b7280',
          300: '#d1d5db',
          100: '#f3f4f6',
        },
      },
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        panel: '0 10px 30px -15px rgba(17, 24, 39, 0.2)',
      },
    },
  },
  plugins: [],
}

