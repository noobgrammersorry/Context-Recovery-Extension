import { useEffect, useRef, useState } from "react"

interface ParallaxSectionProps {
  children: React.ReactNode
  offset?: number
  className?: string
  speed?: number
  direction?: "up" | "down"
}

export function ParallaxSection({
  children,
  offset = 0,
  className = "",
  speed = 0.5,
  direction = "up"
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [yPos, setYPos] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const scrollPosition = window.scrollY
      const elementOffset = ref.current.offsetTop
      const distanceFromTop = scrollPosition - elementOffset + window.innerHeight

      if (distanceFromTop > 0) {
        const movement = (distanceFromTop * speed * (direction === "down" ? 1 : -1)) / 100
        setYPos(movement)
      }
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [speed, direction])

  return (
    <div
      ref={ref}
      className={className}
      style={{
        transform: `translateY(${yPos}px)`,
        transition: "transform 0.1s ease-out"
      }}>
      {children}
    </div>
  )
}

interface GradientBackgroundProps {
  className?: string
  animated?: boolean
}

export function GradientBackground({ className = "", animated = true }: GradientBackgroundProps) {
  return (
    <div
      className={`absolute inset-0 pointer-events-none overflow-hidden ${className} ${
        animated ? "animate-gradient-shift" : ""
      }`}
      style={
        animated
          ? {
              backgroundSize: "200% 200%",
              backgroundImage:
                "linear-gradient(135deg, rgba(20, 184, 166, 0.1) 0%, rgba(6, 182, 212, 0.05) 50%, rgba(30, 58, 138, 0.08) 100%)"
            }
          : {}
      }
    />
  )
}

interface FloatingElementProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  direction?: "up" | "left-up" | "right-up"
}

export function FloatingElement({
  children,
  delay = 0,
  duration = 3,
  className = "",
  direction = "up"
}: FloatingElementProps) {
  const animationName = direction === "left-up" ? "float-left" : direction === "right-up" ? "float-right" : "float"

  return (
    <div
      className={`${className} animate-float`}
      style={{
        animation: `float ${duration}s ease-in-out ${delay}s infinite`
      }}>
      {children}
    </div>
  )
}
