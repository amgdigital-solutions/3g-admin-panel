import { useEffect } from 'react'
import { useLocation } from 'react-router'

/**
 * ScrollToTop component
 * Automatically scrolls window to top whenever the route changes.
 * This fixes the issue where clicking a link takes you to the bottom of the new page.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
