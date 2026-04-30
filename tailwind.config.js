/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // ── UniConnect design tokens (from mockup) ──────────────────
        brand: {
          50:  '#e8f1ff',
          100: '#d3e3ff',
          500: '#426088',
          700: '#00284D',
          900: '#00132a',
        },
        gold: {
          300: '#e9c176',
          400: '#D4AF37',
          500: '#B8972F',
        },
        ink: {
          900: '#1b1c1c',
          700: '#43474e',
          500: '#73777f',
          300: '#c3c6cf',
          200: '#e4e2e1',
          100: '#f0eded',
          50:  '#fbf9f8',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
        },
      },
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        serif: ['"Noto Serif"', 'Georgia', 'serif'],
      },
      boxShadow: {
        panel:  '0 10px 30px -15px rgba(0,0,0,0.20)',
        card:   '0px 4px 20px rgba(0,0,0,0.05)',
        sidebar:'2px 0 24px rgba(0,0,0,0.18)',
      },
      borderRadius: {
        DEFAULT: '0.125rem',
        lg:  '0.25rem',
        xl:  '0.5rem',
        '2xl': '0.75rem',
      },
    },
  },
  plugins: [],
}
