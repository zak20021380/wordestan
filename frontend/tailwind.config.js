/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Vibrant purple - main brand color
        primary: {
          50: '#faf5ff',
          100: '#f3e8ff',
          200: '#e9d5ff',
          300: '#d8b4fe',
          400: '#c084fc',
          500: '#a855f7', // Main vibrant purple
          600: '#9333ea',
          700: '#7e22ce',
          800: '#6b21a8',
          900: '#581c87',
        },
        // Electric pink - secondary accent
        secondary: {
          50: '#fdf4ff',
          100: '#fae8ff',
          200: '#f5d0fe',
          300: '#f0abfc',
          400: '#e879f9',
          500: '#d946ef', // Electric pink
          600: '#c026d3',
          700: '#a21caf',
          800: '#86198f',
          900: '#701a75',
        },
        // Neon cyan - tertiary accent
        accent: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4', // Neon cyan
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
        },
        // Electric blue
        blue: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6', // Electric blue
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        // Modern glass with color tints
        glass: {
          DEFAULT: 'rgba(255, 255, 255, 0.1)',
          hover: 'rgba(255, 255, 255, 0.15)',
          border: 'rgba(255, 255, 255, 0.2)',
          purple: 'rgba(168, 85, 247, 0.15)',
          pink: 'rgba(217, 70, 239, 0.15)',
          cyan: 'rgba(6, 182, 212, 0.15)',
          dark: 'rgba(0, 0, 0, 0.2)',
        },
        // Status colors with modern twist
        success: '#10b981',
        danger: '#f43f5e',
        warning: '#f59e0b',
        info: '#06b6d4',
      },
      fontFamily: {
        sans: ['Vazirmatn', 'Inter', 'system-ui', 'sans-serif'],
        display: ['Vazirmatn', 'Poppins', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'pulse-glow-purple': 'pulseGlowPurple 2s ease-in-out infinite',
        'pulse-glow-pink': 'pulseGlowPink 2s ease-in-out infinite',
        'pulse-glow-cyan': 'pulseGlowCyan 2s ease-in-out infinite',
        'bounce-subtle': 'bounceSubtle 2s ease-in-out infinite',
        'shake': 'shake 0.5s ease-in-out',
        'float': 'float 3s ease-in-out infinite',
        'gradient-shift': 'gradientShift 3s ease infinite',
        'neon-pulse': 'neonPulse 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(217, 70, 239, 0.2)' },
          '50%': { boxShadow: '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(217, 70, 239, 0.4)' },
        },
        pulseGlowPurple: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.8)' },
        },
        pulseGlowPink: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(217, 70, 239, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(217, 70, 239, 0.8)' },
        },
        pulseGlowCyan: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(6, 182, 212, 0.5)' },
          '50%': { boxShadow: '0 0 40px rgba(6, 182, 212, 0.8)' },
        },
        bounceSubtle: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-5px)' },
        },
        shake: {
          '0%, 100%': { transform: 'translateX(0)' },
          '25%': { transform: 'translateX(-5px)' },
          '75%': { transform: 'translateX(5px)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradientShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        neonPulse: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
      },
      backdropBlur: {
        xs: '2px',
        sm: '4px',
        DEFAULT: '8px',
        lg: '16px',
        xl: '24px',
      },
      boxShadow: {
        'glass': '0 8px 32px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 8px 32px rgba(0, 0, 0, 0.2)',
        'glow': '0 0 20px rgba(168, 85, 247, 0.4), 0 0 40px rgba(217, 70, 239, 0.2)',
        'glow-strong': '0 0 30px rgba(168, 85, 247, 0.6), 0 0 60px rgba(217, 70, 239, 0.4)',
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.6), 0 0 40px rgba(168, 85, 247, 0.3)',
        'neon-pink': '0 0 20px rgba(217, 70, 239, 0.6), 0 0 40px rgba(217, 70, 239, 0.3)',
        'neon-cyan': '0 0 20px rgba(6, 182, 212, 0.6), 0 0 40px rgba(6, 182, 212, 0.3)',
        'neon-blue': '0 0 20px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.3)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-purple-pink': 'linear-gradient(135deg, #a855f7 0%, #d946ef 100%)',
        'gradient-pink-cyan': 'linear-gradient(135deg, #d946ef 0%, #06b6d4 100%)',
        'gradient-purple-blue': 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)',
        'gradient-blue-cyan': 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)',
        'gradient-multi': 'linear-gradient(135deg, #a855f7 0%, #d946ef 33%, #06b6d4 66%, #3b82f6 100%)',
        'gradient-dark': 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)',
        'gradient-mesh': 'radial-gradient(at 0% 0%, #a855f7 0%, transparent 50%), radial-gradient(at 100% 0%, #d946ef 0%, transparent 50%), radial-gradient(at 100% 100%, #06b6d4 0%, transparent 50%), radial-gradient(at 0% 100%, #3b82f6 0%, transparent 50%)',
      },
      backgroundSize: {
        'auto': 'auto',
        'cover': 'cover',
        'contain': 'contain',
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
}