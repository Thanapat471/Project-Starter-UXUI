module.exports = {
  content: [
    './src/**/*.{html,ts}',
  ],
  theme: {
    extend: {},
  },
  plugins: [require('daisyui')],
  daisyui: {
    themes: [
      {
        minimal: {
          'primary': '#111111',
          'secondary': '#222222',
          'accent': '#333333',
          'neutral': '#ffffff',
          'base-100': '#ffffff',
          'info': '#a3a3a3',
          'success': '#22c55e',
          'warning': '#eab308',
          'error': '#ef4444',
        }
      },
      'dark'
    ],
    darkTheme: 'minimal',
  }
};
