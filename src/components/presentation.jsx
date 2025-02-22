import { Component } from "@/jsx"
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
    base: cn("quiz-presentation-slide", Styles.Presentation_Slide),
    shown: cn("quiz-presentation-slide--shown", Styles.Presentation_Slide_shown)
  }
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
  if (currentIndex === null) return
  if (currentIndex === slideIndex) return

  const currentNode = slideNodes[currentIndex]
  const nodeToShow = slideNodes[slideIndex]
  assertIsDefined(currentNode, `current node: at index ${currentIndex}`)
  assertIsDefined(nodeToShow, `node to show: at index ${slideIndex}`)
  setSlideState(currentNode, "hidden")
  setSlideState(nodeToShow, "shown")
}

/**
 * @template {PresentationProps} [Props=PresentationProps]
 * @extends {Component<Props>}
 */
export default class Presentation extends Component {
  /** @param {Props} props  */
  constructor(props) {
    const { id, slides } = props

    const slideContents = Array.from(new Set(slides))
    const slideNodes = /** @type {HTMLElement[]} */ (
      slideContents.map((slideContent) => (
        <div className={presentationClasses.slide.base}>{slideContent}</div>
      ))
    )

    const indexOfSlideToShow = 0
    const slideNodeToShow = slideNodes[indexOfSlideToShow]
    const desc = `slide node to show index: ${indexOfSlideToShow}`
    assertIsDefined(slideNodeToShow, desc)
    setSlideState(slideNodeToShow, "shown")

    const presentationNode = (
      <div aria-live="polite" className={presentationClasses.root} id={id}>
        {slideNodes}
      </div>
    )

    super(props, presentationNode)

    /**
     * @readonly
     * @protected
     * @type {HTMLElement[]} */
    this._slideNodes = slideNodes
  }

  currentSlideIndex() {
    const index = getShownSlideIndex(this._slideNodes)
    assertIsDefined(index, "current slide index")
    return index
  }

  /** @param {PresentationRevalidationOptions} options */
  revalidate(options) {
    const { shownSlideIndex } = options
    assertValidSlideIndex(shownSlideIndex, this._slideNodes)
    showSlide(this._slideNodes, shownSlideIndex)
  }

  slideNodes() {
    assertIsDefined(this._slideNodes, "presentation slide nodes")
    return [...this._slideNodes]
  }

  slidesCount() {
    return this._slideNodes.length
  }
}
