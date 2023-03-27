/* eslint-disable no-param-reassign */
import Styles from "../scss/scroll-shadow.module.scss"

const {
  BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY,
  TOP_SCROLL_SHADOW_SIZER_PROPERTY,
  HEIGHT_OF_SCROLL_SHADOW_BOX,
  MAX_SUITABLE_SCROLL_SHADOW_SIZE
} = Styles

const SCROLL_SHADOW_MAX_SUITABLE_SIZE = Number(MAX_SUITABLE_SCROLL_SHADOW_SIZE)

const adjustScrollShadow = (() => {
  let thereAreUnrenderedFrames = false

  return (scrollableElement, scrollShadow, maxSizes) => {
    if (thereAreUnrenderedFrames) return
    window.requestAnimationFrame(() => {
      // Prevent shadow from affecting calculations
      scrollShadow.style.height = "0"

      const {
        clientHeight,
        scrollHeight,
        scrollTop: scrolledTopDistance
      } = scrollableElement

      const scrolledBottomDistance =
        scrollHeight - (scrolledTopDistance + clientHeight)

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

      scrollShadow.style.setProperty(
        TOP_SCROLL_SHADOW_SIZER_PROPERTY,
        `${topShadowSizeToUse}px`
      )

      scrollShadow.style.setProperty(
        BOTTOM_SCROLL_SHADOW_SIZER_PROPERTY,
        `${bottomShadowSizeToUse}px`
      )

      // Prevent scroll shadow from scrolling with content
      scrollShadow.style.top = `${scrolledTopDistance}px`
      scrollShadow.style.height = HEIGHT_OF_SCROLL_SHADOW_BOX

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

  scrollableElement.appendChild(scrollShadow)
  scrollableElement.addEventListener("scroll", adjustAppropriateScrollShadow)

  if (typeof observerConfig === "object" && observerConfig !== null) {
    new MutationObserver((mutationRecords) => {
      const isScrollableElementMutation = mutationRecords.every(
        (mutationRecord) => mutationRecord.target !== scrollShadow
      )
      if (isScrollableElementMutation) adjustAppropriateScrollShadow()
    }).observe(scrollableElement, observerConfig)
  }

  /* Trigger scroll on element to set up scroll shadow if needed */
  setTimeout(() => {
    scrollableElement.scrollTop = 1
    scrollableElement.scrollTop = 0
  })

  return scrollableElement
}
