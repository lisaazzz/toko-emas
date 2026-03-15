import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50:  '#fdfbf3',
          100: '#faf5e4',
          200: '#f5eabf',
          300: '#edd98a',
          400: '#e3c355',
          500: '#d4a830',
          600: '#b8891f',
          700: '#966b18',
          800: '#7a5419',
          900: '#65441b',
        },
        cream: '#FDFBF3',
      },
      fontFamily: {
        cormorant: ['Cormorant Garamond', 'Georgia', 'serif'],
        cinzel: ['Cinzel', 'Georgia', 'serif'],
        dm: ['DM Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
export default config
