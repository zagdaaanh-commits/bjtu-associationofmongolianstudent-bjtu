import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
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
