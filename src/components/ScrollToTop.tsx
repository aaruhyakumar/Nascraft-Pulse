import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

export default function ScrollToTop({ containerRef }: { containerRef: React.RefObject<HTMLElement | null> }) {
  const { pathname } = useLocation()

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [pathname])

  return null
}
