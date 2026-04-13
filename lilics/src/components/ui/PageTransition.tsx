import { useEffect, useRef } from 'react'
import gsap from 'gsap'

interface PageTransitionProps {
  children: React.ReactNode
}

export function PageTransition({ children }: Readonly<PageTransitionProps>) {
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    const node = containerRef.current
    if (!node) {
      return
    }

    gsap.fromTo(
      node,
       { autoAlpha: 0, y: 16 },
       { autoAlpha: 1, y: 0, duration: 0.4, ease: 'power2.out' },
     )
   }, [])

   return <div ref={containerRef}>{children}</div>
}
