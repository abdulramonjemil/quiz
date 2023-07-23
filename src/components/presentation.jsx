/* eslint-disable max-classes-per-file */
import Component, { createInstanceRefHolder } from "../core/component"
import Styles from "../scss/presentation.module.scss"

const SHOWN_SLIDE_CLASS = Styles.Slide_shown
const OPAQUE_SLIDE_CLASS = Styles.Slide_opaque

const SLIDE_FADING_IN_KEYFRAMES = [{ opacity: "0" }, { opacity: "1" }]
const SLIDE_FADING_OUT_KEYFRAMES = [{ opacity: "1" }, { opacity: "0" }]
const SLIDE_ANIMATION_OPTIONS = {
  duration: 200,
  fill: "forwards",
  iterations: 1
}

/**
 * @typedef PresentationRevalidationOptions
 * @property {number} activeSlide
 * @property {any[]} slideContents
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

  fadeIn() {
    return this.$composedNode.animate(
      SLIDE_FADING_IN_KEYFRAMES,
      SLIDE_ANIMATION_OPTIONS
    ).finished
  }

  fadeOut() {
    return this.$composedNode.animate(
      SLIDE_FADING_OUT_KEYFRAMES,
      SLIDE_ANIMATION_OPTIONS
    ).finished
  }

  removeFromDOM() {
    this.$composedNode.classList.remove(SHOWN_SLIDE_CLASS)
  }

  addToDOM(forceVisibility = false) {
    this.$composedNode.classList.add(SHOWN_SLIDE_CLASS)
    if (forceVisibility) this.$composedNode.classList.add(OPAQUE_SLIDE_CLASS)
  }
}

export default class Presentation extends Component {
  $render() {
    const {
      controllingId,
      slides: slideContents,
      startingSlideIndex
    } = this.$props

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
    slideToShow.addToDOM(true)

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
    this.$slideIsChangeable = true
    this.$slideContents = [...slideContents]
    this.$slides = slideInstances

    return presentationNode
  }

  async $showSlide(slideIndex) {
    if (!Number.isInteger(slideIndex) || slideIndex < 0)
      throw new TypeError("Expected a non-negative integer slide index")
    if (!this.$slideIsChangeable) throw new Error("Currently changing slides")

    const { $indexOfCurrentSlide, $slides } = this
    if (slideIndex === $indexOfCurrentSlide) return
    if (slideIndex >= $slides.length)
      throw new RangeError(`There is no slide at index ${slideIndex}`)

    this.$slideIsChangeable = false
    const currentSlide = $slides[$indexOfCurrentSlide]
    const slideToShow = $slides[slideIndex]

    await currentSlide.fadeOut()
    currentSlide.removeFromDOM()
    slideToShow.addToDOM()
    await slideToShow.fadeIn()

    this.$indexOfCurrentSlide = slideIndex
    this.$slideIsChangeable = true
  }

  appendSlide(slideContent) {
    const slideRefHolder = createInstanceRefHolder()
    const slideNode = (
      <Slide content={slideContent} refHolder={slideRefHolder} />
    )

    this.$composedNode.appendChild(slideNode)
    this.$slides.push(slideRefHolder.ref)
  }

  currentSlideIndex() {
    return this.$indexOfCurrentSlide
  }

  async restart() {
    await this.$showSlide(0)
  }

  // /** @param {PresentationRevalidationOptions} options */
  // revalidate(options) {
  //   const { activeSlide, slideContents } = options
  //   // [A, C, E]
  //   // [A, B, C, D, E]
  // }

  async showSlide(slideIndex) {
    await this.$showSlide(slideIndex)
  }

  slideContents() {
    return [...this.$slideContents]
  }

  slideIsChangeable() {
    return this.$slideIsChangeable
  }

  slidesCount() {
    return this.$slides.length
  }
}
