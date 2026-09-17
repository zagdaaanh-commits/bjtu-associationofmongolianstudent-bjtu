import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        pirate: ['Rubik', 'Montserrat', '"Plus Jakarta Sans"', 'sans-serif'],
        medieval: ['Rubik', 'Montserrat', 'sans-serif'],
        cinzel: ['Unbounded', 'Rubik', 'Montserrat', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'Montserrat', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        pirate: {
          gold: '#eab308',
          goldLight: '#fde047',
          goldDark: '#854d0e',
          wood: '#3a2211',
          woodLight: '#5c371c',
          woodDark: '#1e1108',
          parchment: '#f7f1df',
          parchmentDark: '#deb887',
          crimson: '#991b1b',
          crimsonLight: '#dc2626',
          emerald: '#059669',
          ocean: '#0f293a',
          navy: '#0b1622',
        },
        mongol: {
          blue: '#0055A5',
          darkBlue: '#003366',
          red: '#DA291C',
          gold: '#FFD100',
          darkGold: '#C69214',
          sand: '#F7F4EA',
          emerald: '#059669',
        },
      },
    },
  },
  plugins: [],
};
export default config;
