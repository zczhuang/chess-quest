import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Royal palette — kept in sync with the --cq-* tokens in app/globals.css.
        brand: { DEFAULT: '#7c5cff', dark: '#6344e0' },
        gold: { DEFAULT: '#ffc94d', dark: '#f0a818' },
        sky: { DEFAULT: '#4c8dff', dark: '#2f6fd6' },
        mint: { DEFAULT: '#2fb877', dark: '#1f9e63' },
        cherry: '#ff6b5e',
        flame: '#ff9f43',
        ink: '#2b2440',
        line: '#e8e4f2',
        soft: '#f6f4fb',
      },
      fontFamily: {
        sans: ['var(--font-nunito)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { xl2: '1.25rem' },
      boxShadow: {
        pop: '0 4px 0 rgba(43,36,64,0.12)',
        'pop-lg': '0 6px 0 rgba(43,36,64,0.16)',
      },
      keyframes: {
        'cq-bounce-in': {
          '0%': { transform: 'scale(0.6)', opacity: '0' },
          '60%': { transform: 'scale(1.08)', opacity: '1' },
          '100%': { transform: 'scale(1)' },
        },
        'cq-pop': {
          '0%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
          '100%': { transform: 'scale(1)' },
        },
        'cq-float': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        'cq-shake': {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
      },
      animation: {
        'bounce-in': 'cq-bounce-in 0.35s ease-out',
        pop: 'cq-pop 0.3s ease-in-out',
        float: 'cq-float 3s ease-in-out infinite',
        shake: 'cq-shake 0.3s ease-in-out',
      },
    },
  },
  plugins: [],
};
export default config;
