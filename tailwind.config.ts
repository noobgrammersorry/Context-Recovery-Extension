import type { Config } from "tailwindcss"

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        ink: "#1f2937",
        fog: "#f3f4f6",
        accent: "#0f766e",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accentToken: {
          DEFAULT: "hsl(var(--accent-token))",
          foreground: "hsl(var(--accent-token-foreground))"
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)"
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))"
      },
      animation: {
        "pulse-soft": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "pulse-glow": "pulse-glow 2.5s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "slide-in": "slideIn 0.3s ease-out",
        "slide-in-up": "slideInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-down": "slideInDown 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-left": "slideInLeft 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "slide-in-right": "slideInRight 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fadeIn 0.2s ease-out",
        "fade-in-slow": "fadeIn 0.6s ease-out",
        "scale-in": "scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "scale-in-bounce": "scaleInBounce 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
        "bounce-soft": "bounceSmall 1s ease-in-out infinite",
        "float": "float 3s ease-in-out infinite",
        "float-slow": "float 5s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spin 4s linear infinite",
        "reveal": "reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        "reveal-stagger-1": "reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.05s forwards",
        "reveal-stagger-2": "reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards",
        "reveal-stagger-3": "reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.15s forwards",
        "reveal-stagger-4": "reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards",
        "reveal-stagger-5": "reveal 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.25s forwards",
        "morph": "morph 3s ease-in-out infinite",
        "wiggle": "wiggle 0.2s ease-in-out",
        "pulse-border": "pulseBorder 2s ease-in-out infinite",
        "gradient-shift": "gradientShift 4s ease-in-out infinite"
      },
      keyframes: {
        slideIn: {
          "0%": { transform: "translateX(-10px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        slideInUp: {
          "0%": { transform: "translateY(20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideInDown: {
          "0%": { transform: "translateY(-20px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" }
        },
        slideInLeft: {
          "0%": { transform: "translateX(-30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        slideInRight: {
          "0%": { transform: "translateX(30px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" }
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" }
        },
        scaleIn: {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        scaleInBounce: {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "50%": { transform: "scale(1.05)" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        bounceSmall: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-4px)" }
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" }
        },
        glow: {
          "0%, 100%": { boxShadow: "0 0 5px rgba(20, 184, 166, 0.3)" },
          "50%": { boxShadow: "0 0 20px rgba(20, 184, 166, 0.6)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" }
        },
        reveal: {
          "0%": { 
            clipPath: "inset(0 100% 0 0)",
            opacity: "0"
          },
          "100%": { 
            clipPath: "inset(0 0 0 0)",
            opacity: "1"
          }
        },
        morph: {
          "0%, 100%": { borderRadius: "60% 40% 30% 70%/60% 30% 70% 40%" },
          "50%": { borderRadius: "30% 60% 70% 40%/50% 60% 30% 60%" }
        },
        wiggle: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "25%": { transform: "rotate(-2deg)" },
          "75%": { transform: "rotate(2deg)" }
        },
        pulseBorder: {
          "0%, 100%": { borderColor: "rgba(20, 184, 166, 0.3)" },
          "50%": { borderColor: "rgba(20, 184, 166, 0.8)" }
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" }
        }
      },
      transitionDuration: {
        "250": "250ms",
        "350": "350ms",
        "400": "400ms",
        "500": "500ms",
        "600": "600ms",
        "700": "700ms",
        "800": "800ms",
        "900": "900ms",
        "1000": "1000ms"
      },
      transitionTimingFunction: {
        "smooth": "cubic-bezier(0.4, 0, 0.2, 1)",
        "bounce": "cubic-bezier(0.34, 1.56, 0.64, 1)",
        "elastic": "cubic-bezier(0.16, 1, 0.3, 1)",
        "out-quad": "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
        "out-cubic": "cubic-bezier(0.215, 0.61, 0.355, 1)"
      },
      backdropBlur: {
        xs: "2px",
        sm: "4px",
        base: "8px",
        lg: "12px",
        xl: "16px"
      }
    }
  },
  plugins: []
}

export default config
