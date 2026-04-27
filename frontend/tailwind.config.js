export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#F97316',
        brand: {
          orange: '#F97316',
          gold: '#FACC15',
          ink: '#0F172A',
          bg: '#F8FAFC',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          muted: '#64748B',
          orangeSoft: '#FFF7ED',
          goldSoft: '#FEF3C7',
          navySoft: '#E2E8F0',
          code: '#0B1220',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        display: ['Sora', 'Inter', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'SFMono-Regular', 'monospace'],
      },
      boxShadow: {
        brand: '0 18px 40px rgba(15, 23, 42, 0.08)',
        float: '0 24px 60px rgba(15, 23, 42, 0.12)',
      },
      keyframes: {
        'bar-bounce': {
          '0%, 100%': { transform: 'scaleY(0.4)', opacity: '0.3' },
          '50%': { transform: 'scaleY(1)', opacity: '1' },
        },
        'progress-loop': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        }
      },
      animation: {
        'bar-bounce': 'bar-bounce 1s ease-in-out infinite',
        'progress-loop': 'progress-loop 1.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}
