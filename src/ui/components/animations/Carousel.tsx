import { useState, useEffect } from "react"

interface CarouselItem {
  id: string | number
  content: React.ReactNode
}

interface CarouselProps {
  items: CarouselItem[]
  autoPlay?: boolean
  autoPlayInterval?: number
  className?: string
  showIndicators?: boolean
  onSlideChange?: (index: number) => void
}

export function Carousel({
  items,
  autoPlay = true,
  autoPlayInterval = 5000,
  className = "",
  showIndicators = true,
  onSlideChange
}: CarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(autoPlay)

  useEffect(() => {
    if (!isAutoPlay || items.length === 0) return

    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % items.length)
    }, autoPlayInterval)

    return () => clearInterval(interval)
  }, [isAutoPlay, items.length, autoPlayInterval])

  useEffect(() => {
    onSlideChange?.(currentSlide)
  }, [currentSlide, onSlideChange])

  const handlePrev = () => {
    setCurrentSlide((prev) => (prev - 1 + items.length) % items.length)
    setIsAutoPlay(false)
  }

  const handleNext = () => {
    setCurrentSlide((prev) => (prev + 1) % items.length)
    setIsAutoPlay(false)
  }

  if (items.length === 0) {
    return null
  }

  return (
    <div className={`relative w-full ${className}`}>
      {/* Carousel container */}
      <div className="relative overflow-hidden rounded-xl bg-white dark:bg-slate-900">
        <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${currentSlide * 100}%)` }}>
          {items.map((item) => (
            <div key={item.id} className="w-full flex-shrink-0">
              <div className="animate-fade-in">{item.content}</div>
            </div>
          ))}
        </div>
      </div>

      {items.length > 1 && (
        <div className="mt-3 flex items-center justify-between gap-3">
          <button
            onClick={handlePrev}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Previous slide"
            type="button">
            Back
          </button>

          {showIndicators ? (
            <div className="flex justify-center gap-2">
              {items.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentSlide(index)
                    setIsAutoPlay(false)
                  }}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    index === currentSlide
                      ? "w-6 bg-teal-600"
                      : "w-2 bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500"
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                  type="button"
                />
              ))}
            </div>
          ) : (
            <span className="text-xs text-slate-500 dark:text-slate-400">
              {currentSlide + 1}/{items.length}
            </span>
          )}

          <button
            onClick={handleNext}
            className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-medium text-slate-700 transition hover:bg-slate-100 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            aria-label="Next slide"
            type="button">
            Next
          </button>
        </div>
      )}

      {/* Auto-play indicator */}
      {isAutoPlay && items.length > 1 && (
        <div className="absolute bottom-4 right-4 text-xs text-slate-500 dark:text-slate-400">
          Auto-play
        </div>
      )}
    </div>
  )
}
