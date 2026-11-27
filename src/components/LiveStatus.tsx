import { useEffect, useState } from 'react'

interface LiveStatusProps {
  text: string
  // Classes while there is text to show; with none it is sr-only and empty.
  className: string
}

// A polite live region that always mounts empty and takes its text after
// mount. Screen readers often skip a region that appears already holding its
// text, so a view that opens in a status ("Loading...") would say nothing
// (WCAG 4.1.3).
export function LiveStatus({ text, className }: LiveStatusProps) {
  const [mounted, setMounted] = useState(false)
  useEffect(() => {
    setMounted(true)
  }, [])
  const shown = mounted ? text : ''
  return (
    <div aria-live="polite" className={shown ? className : 'acx:sr-only'}>
      {shown}
    </div>
  )
}
