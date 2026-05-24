/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand:        '#002047',
        'brand-mid':  '#0A3A7A',
        'brand-light':'#1a5cbf',
        accent:       '#4A90D9',
        'accent-light':'#7DB8F0',
        bg:           '#060C14',
        bg2:          '#0A1220',
        bg3:          '#0F1A2E',
        bg4:          '#152338',
      },
      fontFamily: {
        sans:      ['DM Sans', 'sans-serif'],
        montserrat:['Montserrat', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
