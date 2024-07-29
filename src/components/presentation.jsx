/* eslint-disable max-classes-per-file */
import Component from "@/core/component"
import { addClasses, cn, hasClasses, removeClasses } from "@/lib/dom"
import { assertIsDefined } from "@/lib/value"
import Styles from "@/scss/presentation.module.scss"

/**
 * @typedef {{ id: string, slides: HTMLElement[] }} PresentationProps
 * @typedef {{ shownSlideIndex: number }} PresentationRevalidationOptions
 */

const presentationClasses = {
  root: cn("quiz-presentation", Styles.Presentation),
  slide: {
    base: cn("quiz-presentation-slide", Styles.Slide),
    shown: cn("quiz-presentation-slide--shown", Styles.Slide_shown)
  },
  slideContent: cn("quiz-presentation-slide-content", Styles.Slide__Content)
}

/**
 * @param {number} slideIndex
 * @param {HTMLElement[]} slideNodes
 */
function assertValidSlideIndex(slideIndex, slideNodes) {
  if (
    !Number.isInteger(slideIndex) ||
    slideIndex < 0 ||
    slideIndex > slideNodes.length - 1
  ) {
    throw new Error(`There is no slide at index: ${slideIndex}`)
  }
}

/** @param {HTMLElement[]} nodes */
function getShownSlideIndex(nodes) {
  const index = nodes.findIndex((node) =>
    hasClasses(node, presentationClasses.slide.shown)
  )
  return index >= 0 ? index : null
}

/**
 * @param {HTMLElement} slide
 * @param {"shown" | "hidden"} state
 */
function setSlideState(slide, state) {
  if (state === "shown") {
    addClasses(slide, presentationClasses.slide.shown)
  } else if (state === "hidden") {
    removeClasses(slide, presentationClasses.slide.shown)
  } else {
    throw new TypeError(`Unknown state: '${state}'`)
  }
}

/**
 * @param {HTMLElement[]} slideNodes
 * @param {number} slideIndex
 */
function showSlide(slideNodes, slideIndex) {
  const currentIndex = getShownSlideIndex(slideNodes)
  if (currentIndex === slideIndex) return

  const currentNode = slideNodes[currentIndex]
  const nodeToShow = slideNodes[slideIndex]
  setSlideState(currentNode, "hidden")
  setSlideState(nodeToShow, "shown")
}

/**
 * @param {Object} param0
 * @param {unknown} param0.content
 */
function Slide({ content }) {
  return (
    <div className={presentationClasses.slide.base}>
      <div className={presentationClasses.slideContent}>{content}</div>
    </div>
  )
}

/**
 * @template {PresentationProps} Props
 * @extends {Component<Props>}
 */
export default class Presentation extends Component {
  $render() {
    const { id, slides } = this.$props

    const slideContents = Array.from(new Set(slides))
    const slideNodes = slideContents.map((slideContent) => (
      <Slide content={slideContent} />
    ))

    const indexOfSlideToShow = 0
    const slideNodeToShow = slideNodes[indexOfSlideToShow]
    setSlideState(slideNodeToShow, "shown")

    const presentationNode = (
      <div aria-live="polite" className={presentationClasses.root} id={id}>
        {slideNodes}
      </div>
    )

    /** @type {HTMLElement[]} */
    this.$slideNodes = slideNodes

    return presentationNode
  }

  currentSlideIndex() {
    const index = getShownSlideIndex(this.$slideNodes)
    assertIsDefined(index, "current slide index")
    return index
  }

  /** @param {PresentationRevalidationOptions} options */
  revalidate(options) {
    const { shownSlideIndex } = options
    assertValidSlideIndex(shownSlideIndex, this.$slideNodes)
    showSlide(this.$slideNodes, shownSlideIndex)
  }

  slideNodes() {
    assertIsDefined(this.$slideNodes, "presentation slide nodes")
    return [...this.$slideNodes]
  }

  slidesCount() {
    return this.$slideNodes.length
  }
}
