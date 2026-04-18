/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
      },
      colors: {
        white: '#F9F5F0', // strict off-white
        black: '#344F1F', // strict dark-green
        transparent: 'transparent',
        current: 'currentColor',
        ...Object.fromEntries(
          ['slate', 'gray', 'zinc', 'neutral', 'stone', 'red', 'orange', 'amber', 'yellow', 'lime', 'green', 'emerald', 'teal', 'cyan', 'sky', 'blue', 'indigo', 'violet', 'purple', 'fuchsia', 'pink', 'rose', 'brand', 'gold'].map(colorObj => [
            colorObj,
            {
              50: '#F9F5F0',  // Off-white
              100: '#F2EAD3', // Beige
              200: '#F2EAD3', // Beige
              300: '#F4991A', // Orange
              400: '#F4991A', // Orange
              500: '#F4991A', // Orange
              600: '#344F1F', // Dark Green
              700: '#344F1F', // Dark Green
              800: '#344F1F', // Dark Green
              900: '#344F1F', // Dark Green
            }
          ])
        )
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #2c421b 0%, #344F1F 50%, #F4991A 100%)',
        'hero-gradient-v2': 'linear-gradient(160deg, #2c421b 0%, #344F1F 40%, #F4991A 70%, #544c3c 100%)',
        'card-gradient': 'linear-gradient(135deg, #344F1F 0%, #544c3c 100%)',
        'green-gradient': 'linear-gradient(135deg, #2c421b 0%, #344F1F 100%)',
        'amber-gradient': 'linear-gradient(135deg, #b26204 0%, #F4991A 100%)',
        'violet-gradient': 'linear-gradient(135deg, #2c421b 0%, #344F1F 100%)',
        'rose-gradient': 'linear-gradient(135deg, #344F1F 0%, #F4991A 100%)',
        'teal-gradient': 'linear-gradient(135deg, #2c421b 0%, #344F1F 100%)',
        'mesh-gradient': 'radial-gradient(ellipse at 20% 50%, rgba(52,79,31,0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(244,153,26,0.1) 0%, transparent 50%)',
        'mesh-gradient-v2': 'radial-gradient(ellipse at 10% 30%, rgba(52,79,31,0.12) 0%, transparent 50%), radial-gradient(ellipse at 90% 70%, rgba(244,153,26,0.1) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(52,79,31,0.06) 0%, transparent 50%)',
        'glass-gradient': 'linear-gradient(135deg, rgba(249,245,240,0.15) 0%, rgba(249,245,240,0.05) 100%)',
        'shine-gradient': 'linear-gradient(135deg, rgba(249,245,240,0.25) 0%, transparent 60%)',
      },
      animation: {
        'float': 'float 3s ease-in-out infinite',
        'float-slow': 'float 5s ease-in-out infinite',
        'float-rotate': 'floatRotate 4s ease-in-out infinite',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'slide-up': 'slideUp 0.5s ease-out',
        'fade-in': 'fadeIn 0.6s ease-out',
        'shimmer': 'shimmer 1.6s ease-in-out infinite',
        'bounce-soft': 'bounceSoft 2s ease-in-out infinite',
        'scale-in': 'scaleIn 0.3s ease-out',
        'gradient-shift': 'gradientShift 8s ease infinite',
        'twinkle': 'twinkle 3s ease-in-out infinite',
        'orbit': 'orbit 8s linear infinite',
        'ripple': 'ripple 1.5s ease-out infinite',
        'badge-shine': 'badgeShine 3s ease-in-out infinite',
        'count-up': 'countUp 0.5s ease-out',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        floatRotate: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-8px) rotate(3deg)' },
        },
        slideUp: {
          '0%': { transform: 'translateY(30px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% center' },
          '100%': { backgroundPosition: '200% center' },
        },
        bounceSoft: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-4px)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.9)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        gradientShift: {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        twinkle: {
          '0%, 100%': { opacity: '0.2', transform: 'scale(0.8)' },
          '50%': { opacity: '1', transform: 'scale(1.2)' },
        },
        orbit: {
          'from': { transform: 'rotate(0deg) translateX(60px) rotate(0deg)' },
          'to': { transform: 'rotate(360deg) translateX(60px) rotate(-360deg)' },
        },
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        badgeShine: {
          '0%': { right: '120%' },
          '40%': { right: '-60%' },
          '100%': { right: '-60%' },
        },
        countUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      boxShadow: {
        'card': '0 2px 16px rgba(0,0,0,0.06)',
        'card-hover': '0 12px 40px rgba(52, 79, 31, 0.14)',
        'card-xl': '0 20px 60px rgba(0,0,0,0.12)',
        'glow': '0 0 30px rgba(244, 158, 26, 0.35)',
        'glow-green': '0 0 30px rgba(16,185,129,0.35)',
        'glow-amber': '0 0 30px rgba(245,158,11,0.35)',
        'glow-lg': '0 0 50px rgba(244, 158, 26, 0.45)',
        'inner-top': 'inset 0 1px 0 rgba(255,255,255,0.15)',
        'xl-brand': '0 20px 60px rgba(52, 79, 31, 0.25)',
        'hero-card': '0 24px 80px rgba(0,0,0,0.25)',
        'floating': '0 8px 32px rgba(0,0,0,0.15)',
        'nav': '0 2px 20px rgba(0,0,0,0.08)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      fontSize: {
        '2xs': ['0.65rem', { lineHeight: '1rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['3.75rem', { lineHeight: '1' }],
        '7xl': ['4.5rem', { lineHeight: '1' }],
      },
      backdropBlur: {
        '2xl': '40px',
        '3xl': '64px',
      },
      transitionDuration: {
        '400': '400ms',
      },
      zIndex: {
        '60': '60',
        '70': '70',
      },
    },
  },
  plugins: [],
}
