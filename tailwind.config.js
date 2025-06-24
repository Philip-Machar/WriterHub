module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        glass: 'rgba(255,255,255,0.15)',
        frost: 'rgba(255,255,255,0.35)',
        icyBlue: '#a3c9f9',
        silver: '#e3e8ee',
        softPurple: '#b8b5ff',
        accent: '#7f5af0',
        dark: '#232946',
        error: '#ff6b6b',
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
        glassHover: '0 12px 40px 0 rgba(31, 38, 135, 0.45)',
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        md: '8px',
        lg: '16px',
        xl: '24px',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
      },
      borderRadius: {
        glass: '1.5rem',
      },
      transitionProperty: {
        glass: 'box-shadow, background-color, border-color, color, fill, stroke, opacity',
      },
    },
  },
  plugins: [],
}; 