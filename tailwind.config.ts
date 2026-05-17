import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Casa Hidalgo
        paper:      '#faf6ec',
        bone:       '#f6f1e6',
        stone:      '#ece5d8',
        'stone-2':  '#ddd2bd',
        ink:        '#1d1916',
        'ink-soft': '#3a342d',
        terra:      '#b94a2c',
        'terra-deep': '#8c3520',
        moss:       '#4a5c3a',
        'moss-deep': '#34452a',
        gold:       '#c69748',
        error:      '#c43c2a',
        success:    '#4a5c3a',
      },
      fontFamily: {
        serif: ['var(--font-fraunces)', 'Fraunces', 'serif'],
        sans:  ['var(--font-inter)', 'Inter', 'system-ui', 'sans-serif'],
        mono:  ['var(--font-mono)', 'JetBrains Mono', 'monospace'],
      },
      borderColor: {
        DEFAULT: 'rgba(29,25,22,0.12)',
        strong:  'rgba(29,25,22,0.25)',
      },
      animation: {
        'fade-in':  'fadeIn 0.25s ease-out',
        'slide-up': 'slideUp 0.35s cubic-bezier(0.2,0.8,0.2,1)',
        'pulse-dot':'pulseDot 2.4s ease-in-out infinite',
        'spin-slow':'spin 0.7s linear infinite',
      },
      keyframes: {
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp:   { from: { opacity: '0', transform: 'translateY(20px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseDot:  { '0%,100%': { opacity: '1', transform: 'scale(1)' }, '50%': { opacity: '0.5', transform: 'scale(1.4)' } },
      }
    }
  },
  plugins: []
};

export default config;
