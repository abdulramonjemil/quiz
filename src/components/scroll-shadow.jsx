/* eslint-disable no-param-reassign */
import Styles from "@/scss/scroll-shadow.module.scss"

const {
  BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY,
  TOP_SCROLL_SHADOW_SIZER_PROPERTY,
  MAX_SUITABLE_SCROLL_SHADOW_SIZE
} = Styles

const SCROLL_SHADOW_MAX_SUITABLE_SIZE = Number(MAX_SUITABLE_SCROLL_SHADOW_SIZE)

function clampToPositive(number) {
  if (!Number.isFinite(number)) throw new TypeError("Expected a finite number")
  return number < 0 ? 0 : number
}

const adjustScrollShadow = (() => {
  let thereAreUnrenderedFrames = false

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

export default function ScrollShadow(
  { observerConfig, maxSizes },
  scrollableElement
) {
  const scrollShadow = <div className={Styles.ScrollShadow} />
  const adjustAppropriateScrollShadow = adjustScrollShadow.bind(
    null,
    scrollableElement,
    scrollShadow,
    maxSizes
  )

  /* eslint-disable-next-line react/destructuring-assignment */
  scrollableElement.addEventListener("scroll", adjustAppropriateScrollShadow)
  new ResizeObserver(adjustAppropriateScrollShadow).observe(scrollableElement)

  if (typeof observerConfig === "object" && observerConfig !== null) {
    new MutationObserver(adjustAppropriateScrollShadow).observe(
      scrollableElement,
      observerConfig
    )
  }

  // Trigger scroll on element if it's initially scrollable to show scroll
  // shadow. This is done asynchronously as it won't be effective if the element
  // isn't yet mounted.
  setTimeout(() => {
    // Stored and reused in case the element has been scrolled down for some reason
    const prevScrollTop = scrollableElement.scrollTop
    scrollableElement.scrollTop += 1

    // If the previous scrollTop was the maximum, scrollTop won't change, so ...
    scrollableElement.scrollTop -= 1
    scrollableElement.scrollTop = prevScrollTop
  }, 100)

  return (
    <>
      {scrollableElement}
      {scrollShadow}
    </>
  )
}
