/* eslint-disable max-classes-per-file */
import Component, { createInstanceRefHolder } from "../core/component"
import Styles from "../scss/presentation.module.scss"

const SHOWN_SLIDE_CLASS = Styles.Slide_shown

/**
 * @param {slideIndex} number
 * @param {Slide[]} progressLevels
 */
function assertValidSlideIndex(slideIndex, slides) {
  if (
    !Number.isInteger(slideIndex) ||
    slideIndex < 0 ||
    slideIndex > slides.length - 1
  ) {
    throw new Error(`There is no slide at index: ${slideIndex}`)
  }
}

/**
 * @typedef PresentationRevalidationOptions
 * @property {number} activeSlide
 */

class Slide extends Component {
  $render() {
    const { content } = this.$props
    return (
      <div className={Styles.Slide}>
        <div className={Styles.Slide__Content}>{content}</div>
      </div>
    )
  }

  /** @param {"shown" | "hidden"} state */
  setShownState(state) {
    const { classList } = this.$composedNode
    if (state === "shown") classList.add(SHOWN_SLIDE_CLASS)
    else if (state === "hidden") classList.remove(SHOWN_SLIDE_CLASS)
    else throw new TypeError(`Unknown state: '${state}'`)
  }
}

export default class Presentation extends Component {
  $render() {
    const { controllingId, slides } = this.$props

    const slideContents = Array.from(new Set(slides))
    const slideNodes = []
    /** @type {Slide[]} */
    const slideInstances = []

    slideContents.forEach((slideContent) => {
      const slideRefHolder = createInstanceRefHolder()
      const slideNode = (
        <Slide content={slideContent} refHolder={slideRefHolder} />
      )
      slideNodes.push(slideNode)
      slideInstances.push(slideRefHolder.ref)
    })

    const indexOfSlideToShow = 0
    const slideToShow = slideInstances[indexOfSlideToShow]
    slideToShow.setShownState("shown")

    const presentationNode = (
      <div
        aria-live="polite"
        className={Styles.Presentation}
        id={controllingId}
      >
        {slideNodes}
      </div>
    )

    /** @type {number} */
    this.$indexOfCurrentSlide = indexOfSlideToShow
    this.$slideContents = [...slideContents]
    this.$slideInstances = slideInstances

    return presentationNode
  }

  $showSlide(slideIndex) {
    const { $indexOfCurrentSlide, $slideInstances } = this
    assertValidSlideIndex(slideIndex, $slideInstances)
    if (slideIndex === $indexOfCurrentSlide) return

    const currentSlide = $slideInstances[$indexOfCurrentSlide]
    const slideToShow = $slideInstances[slideIndex]

    currentSlide.setShownState("hidden")
    slideToShow.setShownState("shown")
    this.$indexOfCurrentSlide = slideIndex
  }

  currentSlideIndex() {
    return this.$indexOfCurrentSlide
  }

  /** @param {PresentationRevalidationOptions} options */
  revalidate(options) {
    const { activeSlide: newActiveSlideIndex } = options
    this.$showSlide(newActiveSlideIndex)
  }

  slideContents() {
    return [...this.$slideContents]
  }

  slidesCount() {
    return this.$slideInstances.length
  }
}
