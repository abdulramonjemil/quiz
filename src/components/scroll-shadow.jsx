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

/** @param {number} number  */
function clampToPositive(number) {
  return number < 0 ? 0 : number
}

const adjustScrollShadow = (() => {
  let thereAreUnrenderedFrames = false

  /**
   * @param {HTMLElement} scrollableElement
   * @param {HTMLElement} scrollShadow
   * @param {ScrollShadowMaxSizes | undefined} [maxSizes]
   */
  return (scrollableElement, scrollShadow, maxSizes) => {
    if (thereAreUnrenderedFrames) return
    window.requestAnimationFrame(() => {
      const {
        clientHeight,
        scrollHeight,
        scrollTop: scrolledTopDistance
      } = scrollableElement

      const scrolledBottomDistance =
        scrollHeight - scrolledTopDistance - clientHeight

      const maxTopSuitableSizeToUse =
        typeof maxSizes?.top === "number"
          ? maxSizes.top
          : SCROLL_SHADOW_MAX_SUITABLE_SIZE

      const maxBottomSuitableSizeToUse =
        typeof maxSizes?.bottom === "number"
          ? maxSizes.bottom
          : SCROLL_SHADOW_MAX_SUITABLE_SIZE

      const topShadowSizeToUse =
        scrolledTopDistance / 2 > maxTopSuitableSizeToUse
          ? maxTopSuitableSizeToUse
          : scrolledTopDistance / 2

      const bottomShadowSizeToUse =
        scrolledBottomDistance / 2 > maxBottomSuitableSizeToUse
          ? maxBottomSuitableSizeToUse
          : scrolledBottomDistance / 2

      // Numbers are clamped because they're sometimes negative (as noticed on
      // chrome for android)
      scrollShadow.style.setProperty(
        TOP_SCROLL_SHADOW_SIZER_PROPERTY,
        `${clampToPositive(topShadowSizeToUse)}px`
      )

      scrollShadow.style.setProperty(
        BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY,
        `${clampToPositive(bottomShadowSizeToUse)}px`
      )

      thereAreUnrenderedFrames = false
    })

    thereAreUnrenderedFrames = true
  }
})()

/**
 * @param {Object} param0
 * @param {MutationObserverInit} [param0.observerConfig]
 * @param {HTMLElement} param0.children
 * @param {ScrollShadowMaxSizes} [param0.maxSizes]
 */
export default function ScrollShadow({ observerConfig, children, maxSizes }) {
  const scrollShadow = <div className={Styles.ScrollShadow} />
  const scrollableElement = children
  const adjustAppropriateScrollShadow = adjustScrollShadow.bind(
    null,
    scrollableElement,
    scrollShadow,
    maxSizes
  )

  /* eslint-disable-next-line react/destructuring-assignment */
  scrollableElement.addEventListener("scroll", adjustAppropriateScrollShadow)
  new ResizeObserver(adjustAppropriateScrollShadow).observe(scrollableElement)

  if (observerConfig) {
    new MutationObserver(adjustAppropriateScrollShadow).observe(
      scrollableElement,
      observerConfig
    )
  }

  // Attempt to trigger scroll on element
  setTimeout(() => {
    /* eslint-disable no-param-reassign */
    const prevScrollTop = scrollableElement.scrollTop
    scrollableElement.scrollTop += 1
    scrollableElement.scrollTop -= 1
    scrollableElement.scrollTop = prevScrollTop
    /* eslint-enable no-param-reassign */
  }, 100)

  return (
    <>
      {scrollableElement}
      {scrollShadow}
    </>
  )
}
