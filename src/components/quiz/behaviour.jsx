import Question from "@/components/question"
import { assertIsDefined, assertIsInstance } from "@/lib/value"
import { attemptElementFocus } from "@/lib/dom"
import { uniqueId } from "@/lib/factory"
import { Tabs } from "@/ui/tabs"
import { getQuizDataForSlide, quizElementIndexToTabName } from "./base"

/**
 * @typedef {import("@/ui/tabs").TabChangeHandler} TabChangeHandler
 *
 * @typedef {import("@/components/progress").default} Progress
 * @typedef {import("@/components/presentation").default} Presentation
 * @typedef {import("@/components/control-panel").default} ControlPanel
 *
 * @typedef {import("./base").QuizAnswerSelectionMode} QuizAnswerSelectionMode
 * @typedef {import("./base").QuizSlideElement} QuizSlideElement
 * @typedef {import("./base").QuizElementInstance} QuizElementInstance
 */

/**
 * @param {Object} param0
 * @param {string | null} param0.tablistLabel
 * @param {QuizSlideElement[]} param0.elements
 * @param {Presentation} param0.presentation
 * @param {Progress} param0.progress
 * @param {TabChangeHandler} param0.tabChangeHandler
 * @param {number} param0.defaultTabIndex
 */
export function setupQuizTabs({
  tablistLabel,
  elements,
  presentation,
  progress,
  tabChangeHandler,
  defaultTabIndex
}) {
  const progressElements = progress.elements()
  const presentationSlides = presentation.slideNodes()

  const qElementToPositionMap = new Map(
    elements
      .filter((element) => element.type === "QUESTION")
      .map((element, index) => [element, index + 1])
  )

  const codeToPositionMap = new Map(
    elements
      .filter((element) => element.type === "CODE_BOARD")
      .map((element, index) => [element, index + 1])
  )

  return new Tabs({
    onTabChange: tabChangeHandler,
    defaultTabName: quizElementIndexToTabName(defaultTabIndex),
    elements: {
      tablist: {
        ref: progressElements.listRoot,
        ariaLabel: tablistLabel
      },
      tabItems: elements.map((element, index) => {
        const elementTabName = quizElementIndexToTabName(index)
        const triggerId = uniqueId()
        const contentId = uniqueId()

        let triggerAriaLabel = ""
        if (element.type === "QUESTION") {
          const i = qElementToPositionMap.get(element) ?? "-"
          triggerAriaLabel = `Question ${i}`
        } else if (element.type === "CODE_BOARD") {
          const i = codeToPositionMap.get(element) ?? "-"
          triggerAriaLabel = `Code Sample ${i}`
        } else if (element.type === "RESULT") {
          triggerAriaLabel = "Result"
        }

        const trigger = progressElements.buttons[index]
        assertIsDefined(trigger, `progress button at index: ${index}`)
        const content = presentationSlides[index]
        assertIsDefined(content, `presentation slide at index: ${index}`)

        return {
          name: elementTabName,
          triggerAriaLabel,
          triggerId,
          contentId,
          refs: {
            trigger,
            content
          }
        }
      })
    }
  })
}

/**
 * Important to not call this as an IIFE as there may be multiple quizzes
 */
export const createQuizShortcutHandlersCreator = () => {
  /**
   * @typedef {{
   *   pressedNumber: number | null,
   *   pressedNumberIsUsed: boolean
   * }} MutableShortcutData
   *
   * @typedef {() => {
   *   elementInstances: QuizElementInstance[],
   *   controlPanel: ControlPanel,
   *   presentation: Presentation,
   *   progress: Progress,
   *   tabs: Tabs,
   *   answerSelectionMode: QuizAnswerSelectionMode
   * }} QuizDataGetter
   *
   * @typedef {(
   *   quizDataGetter: QuizDataGetter,
   *   mutableShortcutData: MutableShortcutData,
   *   event: KeyboardEvent
   * ) => void} QuizShortcutKeyboardEventHandler
   */

  /** @type {QuizShortcutKeyboardEventHandler} */
  const shortcutKeyDownHandler = (getter, mutableShortcutData, event) => {
    const {
      controlPanel,
      presentation,
      progress,
      elementInstances,
      tabs,
      answerSelectionMode
    } = getter.call(null)
    const mutableData = mutableShortcutData

    // Shortcut to select question answer
    if (["a", "b", "c", "d"].includes(event.key.toLowerCase())) {
      const slideIndex = presentation.currentSlideIndex()
      const slideData = getQuizDataForSlide(
        elementInstances,
        slideIndex,
        answerSelectionMode
      )

      if (slideData.slide.isQuestion) {
        assertIsInstance(slideData.slide.ref, Question)
        const index = ["a", "b", "c", "d"].findIndex(
          (letter) => letter === event.key.toLowerCase()
        )
        slideData.slide.ref.simulateClick({ type: "option", index })
      }
      return
    }

    // Shortcut to go to next/prev quiz element
    if (["p", "n"].includes(event.key.toLowerCase())) {
      const key = /** @type {"p" | "n"} */ (event.key.toLowerCase())
      const button = /** @type {const} */ ({ p: "prev", n: "next" })[key]
      const focused = controlPanel.simulateClick(button)
      if (focused) attemptElementFocus(tabs.activeTab().content)
      return
    }

    // Shortcut to show explanation for answered question
    if (event.key.toLowerCase() === "e") {
      const currentSlideIndex = presentation.currentSlideIndex()
      const slideData = getQuizDataForSlide(
        elementInstances,
        currentSlideIndex,
        answerSelectionMode
      )

      if (slideData.quiz.isFinalized && slideData.slide.isQuestion) {
        assertIsInstance(slideData.slide.ref, Question)
        slideData.slide.ref.simulateClick({ type: "toggle" })
      }

      return
    }

    // Shortcut to show result
    if (event.key.toLocaleLowerCase() === "r") {
      const currentSlideIndex = presentation.currentSlideIndex()
      const slideData = getQuizDataForSlide(
        elementInstances,
        currentSlideIndex,
        answerSelectionMode
      )

      if (slideData.quiz.isFinalized) {
        progress.simulateClick(slideData.quiz.resultIndex)
      }

      return
    }

    /**
     * - Shortcut to jump to specific quiz element based on number
     *
     * If the key is a number, we only jump to the slide at the number if
     * there is no other slide that begin with the same number. See comment
     * above key up handler below.
     */
    if (/\d/.test(event.key)) {
      const levelsCount = progress.levelsCount()
      if (!mutableData.pressedNumber) {
        if (levelsCount < Number(event.key) * 10) {
          progress.simulateClick(Number(event.key) - 1)
        } else {
          mutableData.pressedNumber = Number(event.key)
        }
      } else {
        mutableData.pressedNumberIsUsed = true
        progress.simulateClick(
          mutableData.pressedNumber * 10 + Number(event.key) - 1
        )
      }
    }
  }

  /**
   * If multiple slide positions begin with a number, when the number is
   * clicked, we don't immediately jump to the slide at that position until the
   * key is released, or another key is pressed. For example, if there are 12
   * slides, pressing on 1 doesn't jump to the first slide immediately because
   * the intended slide can be 1, 11, or 12. If the key is released, we jump to
   * 1, else if another key is pressed (1 or 2) while holding down 1 (1 can be
   * pressed down to mean two 1's), we jump to the appropriate position.
   *
   * @type {QuizShortcutKeyboardEventHandler}
   */
  const shortcutKeyUpHandler = (getter, mutableShortcutData, event) => {
    const { progress } = getter.call(null)
    const mutableData = mutableShortcutData
    const { pressedNumber, pressedNumberIsUsed } = mutableData
    if (Number(event.key) !== pressedNumber) return

    if (!pressedNumberIsUsed) {
      progress.simulateClick(pressedNumber - 1)
    }

    mutableData.pressedNumber = null
    mutableData.pressedNumberIsUsed = false
  }

  /** @param {QuizDataGetter} quizDataGetter */
  return (quizDataGetter) => {
    /** @type {MutableShortcutData} */
    const mutableData = {
      pressedNumber: null,
      pressedNumberIsUsed: false
    }

    return {
      keydown: shortcutKeyDownHandler.bind(null, quizDataGetter, mutableData),
      keyup: shortcutKeyUpHandler.bind(null, quizDataGetter, mutableData)
    }
  }
}
