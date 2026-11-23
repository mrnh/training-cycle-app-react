import { useEffect } from 'react'

const EDGE = 24 // px from the left screen edge where a swipe may start
const DECIDE = 10 // px of movement before deciding between a back swipe and scrolling
const FLICK = 0.5 // px/ms: a quick flick goes back even when it is short
const DURATION = 200 // ms of the slide-out / spring-back animation

/**
 * Swipe back like on iOS: a swipe that starts at the left screen edge moves the page with the
 * finger; letting go past a third of the width (or flicking) taps the screen's ‹ back button,
 * otherwise the page springs back. Does nothing on screens without a back button
 * (buttons marked `data-back`) or while a dialog is open. The installed iPhone app has no system
 * swipe-back of its own, so this provides it.
 */
export default function useEdgeSwipeBack(enabled) {
  useEffect(() => {
    if (!enabled) return
    let swipe = null // { x, y, t, page, button, horizontal: true | false | undefined, dx }

    const backButton = () => (document.querySelector('dialog[open]') ? null : document.querySelector('main [data-back]'))
    const place = (page, dx, animate) => {
      page.style.transition = animate ? `transform ${DURATION}ms ease-out` : 'none'
      page.style.transform = dx ? `translateX(${dx}px)` : ''
      page.classList.toggle('swiping', dx > 0)
    }

    const start = (e) => {
      const touch = e.touches[0]
      if (e.touches.length !== 1 || touch.clientX > EDGE) return
      const button = backButton()
      const page = document.querySelector('main')
      if (!button || !page) return
      swipe = { x: touch.clientX, y: touch.clientY, t: e.timeStamp, page, button, horizontal: undefined, dx: 0 }
    }

    const move = (e) => {
      if (!swipe) return
      const touch = e.touches[0]
      const dx = touch.clientX - swipe.x
      const dy = touch.clientY - swipe.y
      if (swipe.horizontal === undefined) {
        if (Math.abs(dx) < DECIDE && Math.abs(dy) < DECIDE) return
        swipe.horizontal = dx > Math.abs(dy) // mostly to the right: back swipe; else let it scroll
        if (!swipe.horizontal) return void (swipe = null)
      }
      e.preventDefault() // no scrolling while the page follows the finger
      swipe.dx = Math.max(0, dx)
      swipe.velocity = (swipe.dx - (swipe.lastDx ?? 0)) / Math.max(1, e.timeStamp - (swipe.lastT ?? swipe.t))
      swipe.lastDx = swipe.dx
      swipe.lastT = e.timeStamp
      place(swipe.page, swipe.dx, false)
    }

    // A cancelled touch (e.g. an incoming call) never goes back
    const end = (e) => {
      if (!swipe) return
      const { page, button, dx, velocity = 0, horizontal } = swipe
      swipe = null
      if (!horizontal) return
      const width = window.innerWidth
      if (e.type === 'touchend' && (dx > width / 3 || (velocity > FLICK && dx > EDGE))) {
        // Slide out, then show the previous screen in place
        place(page, width, true)
        setTimeout(() => {
          button.click()
          place(page, 0, false)
        }, DURATION)
      } else {
        place(page, 0, true)
      }
    }

    document.addEventListener('touchstart', start, { passive: true })
    document.addEventListener('touchmove', move, { passive: false })
    document.addEventListener('touchend', end)
    document.addEventListener('touchcancel', end)
    return () => {
      document.removeEventListener('touchstart', start)
      document.removeEventListener('touchmove', move)
      document.removeEventListener('touchend', end)
      document.removeEventListener('touchcancel', end)
    }
  }, [enabled])
}
