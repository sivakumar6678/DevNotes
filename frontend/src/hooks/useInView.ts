import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Returns `{ ref, inView }`.
 * Attach `ref` to any DOM element via a ref-callback.
 * `inView` becomes `true` once the element enters the viewport and stays true.
 *
 * @param rootMargin  Pre-load margin, e.g. "300px" means trigger 300 px
 *                    before the element scrolls into view.
 */
export function useInView(rootMargin = '200px') {
  const observerRef = useRef<IntersectionObserver | null>(null)
  const [inView, setInView] = useState(false)

  // Clean up on unmount.
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  const ref = useCallback(
    (el: Element | null) => {
      // Disconnect any previous observer.
      observerRef.current?.disconnect()
      observerRef.current = null

      if (!el) return

      if (typeof IntersectionObserver === 'undefined') {
        // Fallback for SSR / old browsers.
        setInView(true)
        return
      }

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setInView(true)
            observer.disconnect()
          }
        },
        { rootMargin },
      )

      observer.observe(el)
      observerRef.current = observer
    },
    // rootMargin is stable across renders in our usage.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [rootMargin],
  )

  return { ref, inView }
}
