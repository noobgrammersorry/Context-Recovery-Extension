import { useEffect, useRef, useState } from "react"

interface ScrollRevealProps {
  children: React.ReactNode
  delay?: number
  duration?: number
  className?: string
  threshold?: number
}

export function ScrollReveal({
  children,
  delay = 0,
  duration = 600,
  className = "",
  threshold = 0.15
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(entry.target)
        }
      },
      { threshold }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold])

  return (
    <div
      ref={ref}
      className={`${className} ${isVisible ? "animate-reveal" : "opacity-0"}`}
      style={{
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        animationFillMode: "forwards"
      }}>
      {children}
    </div>
  )
}

interface ScrollRevealListProps {
  children: React.ReactNode[]
  staggerDelay?: number
  threshold?: number
}

export function ScrollRevealList({
  children,
  staggerDelay = 80,
  threshold = 0.15
}: ScrollRevealListProps) {
  return (
    <>
      {Array.isArray(children) &&
        children.map((child, index) => (
          <ScrollReveal
            key={index}
            delay={index * staggerDelay}
            threshold={threshold}>
            {child}
          </ScrollReveal>
        ))}
    </>
  )
}
