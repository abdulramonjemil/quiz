/* eslint-disable max-classes-per-file */
import Component, { createInstanceRefHolder } from "../core/component"
import Styles from "../scss/presentation.module.scss"

const SHOWN_SLIDE_CLASS = Styles.Slide_shown

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
    const { controllingId, slides, startingSlideIndex } = this.$props

    const slideContents = Array.from(new Set(slides))
    const slideNodes = []
    const slideInstances = []

    slideContents.forEach((slideContent) => {
      const slideRefHolder = createInstanceRefHolder()
      const slideNode = (
        <Slide content={slideContent} refHolder={slideRefHolder} />
      )
      slideNodes.push(slideNode)
      slideInstances.push(slideRefHolder.ref)
    })

    let indexOfSlideToShow = 0
    if (Number.isInteger(startingSlideIndex)) {
      if (startingSlideIndex < 0 || startingSlideIndex >= slideNodes.length)
        throw new RangeError(
          `There is no slide at index: ${startingSlideIndex}`
        )
      indexOfSlideToShow = startingSlideIndex
    }

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

    this.$indexOfCurrentSlide = indexOfSlideToShow
    this.$slideContents = [...slideContents]
    this.$slideInstances = slideInstances

    return presentationNode
  }

  $showSlide(slideIndex) {
    if (!Number.isInteger(slideIndex) || slideIndex < 0)
      throw new TypeError("Expected a non-negative integer slide index")

    const { $indexOfCurrentSlide, $slideInstances } = this
    if (slideIndex === $indexOfCurrentSlide) return
    if (slideIndex >= $slideInstances.length)
      throw new RangeError(`There is no slide at index ${slideIndex}`)

    const currentSlide = $slideInstances[$indexOfCurrentSlide]
    const slideToShow = $slideInstances[slideIndex]

    currentSlide.setShownState("hidden")
    slideToShow.setShownState("shown")
    this.$indexOfCurrentSlide = slideIndex
  }

  appendSlide(slideContent) {
    const slideRefHolder = createInstanceRefHolder()
    const slideNode = (
      <Slide content={slideContent} refHolder={slideRefHolder} />
    )

    this.$composedNode.appendChild(slideNode)
    this.$slideInstances.push(slideRefHolder.ref)
  }

  currentSlideIndex() {
    return this.$indexOfCurrentSlide
  }

  restart() {
    this.$showSlide(0)
  }

  /** @param {PresentationRevalidationOptions} options */
  async revalidate(options) {
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
