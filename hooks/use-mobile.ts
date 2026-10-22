import * as React from "react"

// Viewports narrower than this width use the mobile layout.
const MOBILE_BREAKPOINT = 768

/**
 * Reports whether the viewport is narrower than the mobile breakpoint.
 *
 * Checks the viewport after mounting and updates when it crosses the breakpoint.
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    }
    mql.addEventListener("change", onChange)
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT)
    return () => mql.removeEventListener("change", onChange)
  }, [])

  return !!isMobile
}
