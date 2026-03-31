import React, { useState } from "react"

interface AnimatedCardProps {
  children: React.ReactNode
  className?: string
  hoverEffect?: "lift" | "glow" | "scale" | "rotate" | "all"
  animated?: boolean
  delay?: number
  onClick?: () => void
  role?: string
  tabIndex?: number
}

export function AnimatedCard({
  children,
  className = "",
  hoverEffect = "all",
  animated = true,
  delay = 0,
  onClick,
  role,
  tabIndex
}: AnimatedCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  const baseClasses =
    "relative rounded-xl border border-transparent bg-white/80 backdrop-blur-sm dark:bg-slate-900/80 transition-all duration-300"

  const effectClasses = {
    lift: isHovered ? "translate-y-[-4px] shadow-lg" : "shadow-md",
    glow: isHovered ? "border-teal-400 shadow-lg shadow-teal-500/20" : "border-slate-200 dark:border-slate-700 shadow-sm",
    scale: isHovered ? "scale-[1.02]" : "scale-100",
    rotate: isHovered ? "rotate-[0.5deg]" : "rotate-0",
    all: isHovered
      ? "translate-y-[-4px] scale-[1.01] border-teal-400/50 shadow-lg shadow-teal-500/20"
      : "border-slate-200 dark:border-slate-700 shadow-sm"
  }

  const hoverClass = effectClasses[hoverEffect]

  return (
    <div
      className={`${baseClasses} ${hoverClass} ${className} ${animated ? "animate-slide-in-up" : ""}`}
      style={animated ? { animationDelay: `${delay}ms`, animationFillMode: "both" } : {}}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={onClick}
      role={role}
      tabIndex={tabIndex}>
      {children}
    </div>
  )
}

interface PremiumButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost" | "danger"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  loading?: boolean
  className?: string
  type?: "button" | "submit" | "reset"
  icon?: React.ReactNode
  iconPosition?: "left" | "right"
}

export function PremiumButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  className = "",
  type = "button",
  icon,
  iconPosition = "left"
}: PremiumButtonProps) {
  const baseClasses =
    "relative font-medium transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer"

  const sizeClasses = {
    sm: "px-3 py-1.5 text-xs rounded-lg",
    md: "px-4 py-2 text-sm rounded-lg",
    lg: "px-6 py-3 text-base rounded-xl"
  }

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-teal-600 to-teal-700 text-white hover:shadow-lg hover:shadow-teal-500/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0",
    secondary:
      "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0",
    ghost:
      "bg-transparent text-teal-600 dark:text-teal-400 border border-teal-200 dark:border-teal-800 hover:bg-teal-50 dark:hover:bg-teal-950/30 hover:border-teal-400 disabled:opacity-60",
    danger:
      "bg-gradient-to-r from-rose-600 to-rose-700 text-white hover:shadow-lg hover:shadow-rose-500/50 hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:shadow-none disabled:hover:translate-y-0"
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {loading && (
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
      )}
      {icon && iconPosition === "left" && !loading && icon}
      {children}
      {icon && iconPosition === "right" && !loading && icon}
    </button>
  )
}
