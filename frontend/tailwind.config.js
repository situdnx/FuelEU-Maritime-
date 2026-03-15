/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Bebas Neue"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        body: ['"DM Sans"', 'sans-serif'],
      },
      colors: {
        ocean: {
          950: '#010b14',
          900: '#020f1c',
          800: '#041929',
          700: '#072540',
          600: '#0a3258',
          500: '#0e4070',
          400: '#1a5fa0',
          300: '#2a80cc',
          200: '#5ba8e8',
          100: '#a8d4f5',
          50:  '#e8f5ff',
        },
        fuel: {
          green:  '#00e8a0',
          yellow: '#ffe066',
          red:    '#ff4d6a',
          blue:   '#38bdf8',
        },
      },
      backgroundImage: {
        'grid-ocean': `linear-gradient(rgba(10,50,88,0.3) 1px, transparent 1px),
                       linear-gradient(90deg, rgba(10,50,88,0.3) 1px, transparent 1px)`,
      },
    },
  },
  plugins: [],
};
