/** Paleta própria do CYKL: verde-floresta (confiança/sustentabilidade) + ouro-mel (ação/solidariedade). */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { 50: '#eef7f3', 100: '#d5ece2', 200: '#abd8c6', 500: '#2f8a6b', 600: '#1f7358', 700: '#145c46', 800: '#0f4a39', 900: '#0b3a2d' },
        honey: { 300: '#f7cf6b', 400: '#f2b632', 500: '#e0a01a' },
        ink: { DEFAULT: '#1c2a25', soft: '#51625b' },
        paper: '#f5f7f4',
        line: '#dde4df',
      },
      fontFamily: {
        display: ['"Bricolage Grotesque"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['"Public Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
