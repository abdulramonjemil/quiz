import { cn } from "@/lib/dom"
import { assertIsInstance } from "@/lib/value"
import Styles from "@/scss/scroll-shadow.module.scss"

/**
 * @typedef {{ top?: number, bottom?: number }} ScrollShadowMaxSizes
 */

// eslint-disable-next-line prefer-destructuring
const BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY = /** @type {string} */ (
  Styles.BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY
)

// eslint-disable-next-line prefer-destructuring
const TOP_SCROLL_SHADOW_SIZER_PROPERTY = /** @type {string} */ (
  Styles.TOP_SCROLL_SHADOW_SIZER_PROPERTY
)

const SCROLL_SHADOW_MAX_SUITABLE_SIZE = Number(
  Styles.MAX_SUITABLE_SCROLL_SHADOW_SIZE
)

const scrollShadowClasses = {
  root: cn("quiz-scroll-shadow", Styles.ScrollShadow)
}

/** @param {number} number  */
function toPositive(number) {
  return number < 0 ? 0 : number
}

const createAdjustScrollShadow = () => {
  let scheduledFrame = /** @type {number | null} */ (null)

  /**
   * @param {HTMLElement} scrollableElement
   * @param {HTMLElement} scrollShadow
   * @param {ScrollShadowMaxSizes | undefined} [maxSizes]
   */
  return (scrollableElement, scrollShadow, maxSizes) => {
    if (scheduledFrame !== null) {
      window.cancelAnimationFrame(scheduledFrame)
    }

    scheduledFrame = window.requestAnimationFrame(() => {
      const { clientHeight, scrollHeight, scrollTop } = scrollableElement
      const scrollBottom = scrollHeight - scrollTop - clientHeight

      const maxTop = maxSizes?.top ?? SCROLL_SHADOW_MAX_SUITABLE_SIZE
      const maxBottom = maxSizes?.bottom ?? SCROLL_SHADOW_MAX_SUITABLE_SIZE

      const topShadowSize = scrollTop / 2 > maxTop ? maxTop : scrollTop / 2
      const bottomShadowSize =
        scrollBottom / 2 > maxBottom ? maxBottom : scrollBottom / 2

      // Numbers are clamped because they're sometimes negative (as noticed on
      // chrome for android)
      scrollShadow.style.setProperty(
        TOP_SCROLL_SHADOW_SIZER_PROPERTY,
        `${toPositive(topShadowSize)}px`
      )

      scrollShadow.style.setProperty(
        BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY,
        `${toPositive(bottomShadowSize)}px`
      )

      scheduledFrame = null
    })
  }
}

/**
 * @param {Object} param0
 * @param {MutationObserverInit} [param0.observerConfig]
 * @param {Node} param0.children
 * @param {ScrollShadowMaxSizes} [param0.maxSizes]
 */
export default function ScrollShadow({ observerConfig, children, maxSizes }) {
  const scrollShadow = /** @type {HTMLElement} */ (
    <div className={scrollShadowClasses.root} />
  )

  assertIsInstance(children, HTMLElement)
  const scrollableElement = children
  const adjustShadow = () => {
    createAdjustScrollShadow()(scrollableElement, scrollShadow, maxSizes)
  }

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
