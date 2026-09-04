import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // Official-style FPL palette
        fpl: {
          purple: '#37003c',
          purpledark: '#240029',
          green: '#00ff85',
          pink: '#e90052',
          cyan: '#04f5ff',
          grey: '#f2f2f2',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui'],
      },
    },
  },
  plugins: [],
};
export default config;
