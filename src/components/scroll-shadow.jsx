import { cn } from "@/lib/dom"
import { assertIsInstance } from "@/lib/value"
import Styles from "@/scss/scroll-shadow.module.scss"

// eslint-disable-next-line prefer-destructuring
const SCROLLABLE_ELEMENT_SCROLL_BOTTOM = /** @type {string} */ (
  Styles.SCROLLABLE_ELEMENT_SCROLL_BOTTOM
)

// eslint-disable-next-line prefer-destructuring
const SCROLLABLE_ELEMENT_SCROLL_TOP = /** @type {string} */ (
  Styles.SCROLLABLE_ELEMENT_SCROLL_TOP
)

const scrollShadowClasses = {
  root: cn("quiz-scroll-shadow", Styles.ScrollShadow)
}

/** @param {number} number  */
function nonNegative(number) {
  return number < 0 ? 0 : number
}

const createAdjustScrollShadow = () => {
  let scheduledFrame = /** @type {number | null} */ (null)

  /**
   * @param {HTMLElement} scrollableElement
   * @param {HTMLElement} scrollShadow
   */
  return (scrollableElement, scrollShadow) => {
    if (scheduledFrame !== null) {
      window.cancelAnimationFrame(scheduledFrame)
    }

    scheduledFrame = window.requestAnimationFrame(() => {
      const { clientHeight, scrollHeight, scrollTop } = scrollableElement
      const scrollBottom = scrollHeight - scrollTop - clientHeight

      // Numbers are clamped because they're sometimes negative (as noticed on
      // chrome for android)
      scrollShadow.style.setProperty(
        SCROLLABLE_ELEMENT_SCROLL_TOP,
        `${nonNegative(scrollTop)}px`
      )

      scrollShadow.style.setProperty(
        SCROLLABLE_ELEMENT_SCROLL_BOTTOM,
        `${nonNegative(scrollBottom)}px`
      )

      scheduledFrame = null
    })
  }
}

/**
 * @param {Object} param0
 * @param {MutationObserverInit} [param0.observerConfig]
 * @param {Node} param0.children
 */
export default function ScrollShadow({ observerConfig, children }) {
  const scrollShadow = /** @type {HTMLElement} */ (
    <div className={scrollShadowClasses.root} />
  )

  assertIsInstance(children, HTMLElement)
  const scrollableElement = children
  const adjustShadow = createAdjustScrollShadow().bind(
    null,
    scrollableElement,
    scrollShadow
  )

  /* eslint-disable-next-line react/destructuring-assignment */
  scrollableElement.addEventListener("scroll", adjustShadow)
  new ResizeObserver(adjustShadow).observe(scrollableElement)

  if (observerConfig) {
    const observer = new MutationObserver(adjustShadow)
    observer.observe(scrollableElement, observerConfig)
  }

  // Attempt to set shadow before and after appending to dom
  adjustShadow()
  setTimeout(adjustShadow, 0)

  return (
    <>
      {scrollableElement}
      {scrollShadow}
    </>
  )
}
