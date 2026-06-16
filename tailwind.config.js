/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: '#0B0D12',
        panel: '#13151B',
        panel2: '#1A1D24',
        paper: '#F5F3EE',
        paper2: '#ECE8DF',
        ember: '#FF5A3C',
        emberSoft: '#FF8A6B',
        signal: '#3DD9C4',
        slate: '#8A93A3',
        slateDeep: '#5B6472',
        amber: '#F2B544',
        violet: '#9D8CFF',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['"Inter"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        glow: '0 0 0 1px rgba(255,90,60,0.15), 0 8px 24px -8px rgba(255,90,60,0.25)',
      },
      keyframes: {
        pulseBeat: {
          '0%, 100%': { transform: 'scaleY(1)', opacity: '0.85' },
          '50%': { transform: 'scaleY(1.6)', opacity: '1' },
        },
        riseIn: {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        pulseBeat: 'pulseBeat 1.8s ease-in-out infinite',
        riseIn: 'riseIn 0.4s ease-out both',
      },
    },
  },
  plugins: [],
}

