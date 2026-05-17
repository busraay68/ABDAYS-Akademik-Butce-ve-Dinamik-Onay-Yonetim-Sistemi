/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#123047',
        slate: '#4e6476',
        mist: '#eef4f7',
        tide: '#2a8f84',
        tideDark: '#1c6d64',
        coral: '#e67e4d',
        sand: '#f5ece2',
        success: '#1f8a58',
        warning: '#b78103',
        danger: '#b23a48',
      },
      fontFamily: {
        display: ['"Aptos Display"', 'Manrope', 'ui-sans-serif', 'system-ui'],
        body: ['"Aptos"', 'Manrope', 'ui-sans-serif', 'system-ui'],
      },
      boxShadow: {
        soft: '0 20px 60px rgba(18, 48, 71, 0.12)',
      },
      backgroundImage: {
        'page-radial':
          'radial-gradient(circle at top right, rgba(42, 143, 132, 0.18), transparent 32%), radial-gradient(circle at bottom left, rgba(230, 126, 77, 0.16), transparent 28%)',
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.45s ease-out',
      },
    },
  },
  plugins: [],
};
