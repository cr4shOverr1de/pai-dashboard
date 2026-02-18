/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'tn': {
          bg: '#1a1b26',
          'bg-dark': '#16161e',
          'bg-darker': '#0f0f14',
          'bg-highlight': '#292e42',
          fg: '#c0caf5',
          'fg-dark': '#a9b1d6',
          'fg-gutter': '#3b4261',
          comment: '#565f89',
          blue: '#7aa2f7',
          cyan: '#7dcfff',
          magenta: '#bb9af7',
          purple: '#9d7cd8',
          orange: '#ff9e64',
          yellow: '#e0af68',
          green: '#9ece6a',
          red: '#f7768e',
          'red-bright': '#ff5555',
          teal: '#1abc9c',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [],
}
