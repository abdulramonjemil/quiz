import { rh } from "@/jsx"
import { assertCondition, assertIsDefined } from "@/lib/value"
import CodeBoard from "@/components/code-board"
import Question from "@/components/question"
import Result from "@/components/result"

import {
  getStorageKey,
  getStoredQuizData,
  removeStoredQuizData,
  storedDataIsValidForQuiz
} from "./storage"

/**
 * @typedef {import("@/components/result").ResultProps} ResultProps
 *
 * @typedef {import("./base").QuizProps} QuizProps
 * @typedef {import("./base").QuizSlideElement} QuizSlideElement
 * @typedef {import("./base").QuizInquiryElement} QuizInquiryElement
 * @typedef {import("./base").QuizElementInstance} QuizElementInstance
 * @typedef {import("./base").FinalizedQuizInquiryElement} FinalizedQuizInquiryElement
 * @typedef {import("./base").FinalizedQuizQuestionElement} FinalizedQuizQuestionElement
 * @typedef {import("./base").DecodedStoredQuizElement} DecodedStoredQuizElement
 */

/**
 * @param {QuizInquiryElement | FinalizedQuizInquiryElement} element
 * @returns {element is FinalizedQuizInquiryElement}
 */
function isFinalizedQuizInquiryElement(element) {
  if (element.type === "CODE_BOARD") return true
  if (element.type === "QUESTION") {
    const e = /** @type {FinalizedQuizQuestionElement} */ (element)
    return (
      e.selectedOptionIndex >= 0 && e.selectedOptionIndex < e.options.length
    )
  }
  return false
}

/**
 * @param {DecodedStoredQuizElement[]} decoded
 * @param {QuizInquiryElement[]} elements
 * @returns {FinalizedQuizInquiryElement[]}
 */
export function decodedDataToFinalizedElement(decoded, elements) {
  return elements.map((element, index) => {
    if (element.type === "CODE_BOARD") return element
    const d = decoded[index]
    const msg = `decoded data at index: ${index} is question`
    assertCondition(d?.type === "QUESTION", msg)
    return { ...element, selectedOptionIndex: d.selectedOptionIndex }
  })
}

/**
 * @param {QuizInquiryElement[]} elements
 */
export function assertValidQuizPropsElementConfig(elements) {
  const elementsCount = elements.length
  if (elementsCount < 1 || elementsCount > 5) {
    throw new TypeError("There can only be 1 to 5 quiz elements")
  }

  const lastQuizElement = elements[elementsCount - 1]
  assertIsDefined(lastQuizElement, "last quiz element")
  if (lastQuizElement.type !== "QUESTION") {
    throw new TypeError("The last element in a quiz must be a question")
  }
}

/**
 * @param {Object} param0
 * @param {(QuizInquiryElement | FinalizedQuizInquiryElement)[]} param0.elements
 * @param {QuizElementInstance[]} param0.elementInstances
 * @param {boolean} param0.previouslyFinalized
 * @param {QuizProps["autosave"]} param0.autoSaveConfig
 * @returns {FinalizedQuizInquiryElement[] | null}
 */
export function getAvailableFinalizedElements({
  elements,
  elementInstances,
  previouslyFinalized,
  autoSaveConfig
}) {
  if (previouslyFinalized) {
    const filtered = elements.filter(isFinalizedQuizInquiryElement)
    if (filtered.length !== elements.length) {
      throw new Error("Expected all elements to be finalized")
    }
    return filtered
  }

  if (autoSaveConfig) {
    const storageKey = getStorageKey(autoSaveConfig)
    const storedData = getStoredQuizData(storageKey)
    if (storedData) {
      if (!storedDataIsValidForQuiz(storedData, elements)) {
        // eslint-disable-next-line no-console
        console.error(
          "Unmatching quiz data read from storage:\n\n" +
            `${JSON.stringify(storedData, null, 2)}\n\n` +
            "This could be because there are multiple quizzes using the same storage key."
        )

        removeStoredQuizData(storageKey)
        return null
      }
      return decodedDataToFinalizedElement(storedData.elements, elements)
    }
  }

  const answerData = elementInstances
    .filter(/** @returns {e is Question} */ (e) => e instanceof Question)
    .map((q) => q.getAnswerSelectionData())
  if (answerData.some((d) => d === null)) return null

  let questionIndex = -1
  return elements.map((element) => {
    if (element.type === "CODE_BOARD") return element
    questionIndex += 1
    const d = answerData[questionIndex]
    const msg = `answer selection data for question index: ${questionIndex}`
    assertIsDefined(d, msg)
    const { selectedOptionIndex } = d
    return /** @satisfies {FinalizedQuizQuestionElement} */ {
      ...element,
      selectedOptionIndex
    }
  })
}

/**
 * @param {{
 *   elements: QuizSlideElement[],
 *   codeBoardTheme: QuizProps["codeBoardTheme"]
 *   getResultSummaryText: ResultProps["getSummaryText"],
 *   animateResultIndicator: QuizProps["animateResultIndicator"],
 *   handleQuestionOptionChange: () => void,
 *   handleResultCTAButtonClick: ResultProps["handleCTAButtonClick"]
 * }} param0
 */
export function buildQuizSlideElements({
  elements,
  codeBoardTheme,
  animateResultIndicator,
  getResultSummaryText,
  handleQuestionOptionChange,
  handleResultCTAButtonClick
}) {
  /** @type {HTMLElement[]} */
  const elementNodes = []
  /** @type {QuizElementInstance[]} */
  const elementInstances = []

  elements.forEach((element) => {
    /** @type {HTMLElement} */
    let slideNode
    /** @type {QuizElementInstance} */
    let slideInstance

    if (element.type === "CODE_BOARD") {
      const node = (
        <CodeBoard
          title={element.title}
          language={element.language}
          snippet={element.snippet}
          theme={codeBoardTheme}
        />
      )
      slideNode = /** @type {HTMLElement} */ (node)
      slideInstance = null
    } else if (element.type === "QUESTION") {
      const questionInstanceRH = /** @type {typeof rh<Question>} */ (rh)(null)
      const node = (
        <Question
          title={element.title}
          options={element.options}
          answerIndex={element.answerIndex}
          explanation={element.explanation}
          handleOptionChange={handleQuestionOptionChange}
          instanceRefHolder={questionInstanceRH}
        />
      )
      slideNode = /** @type {HTMLElement} */ (node)
      slideInstance = questionInstanceRH.ref
    } else {
      const resultRH = /** @type {typeof rh<Result>} */ (rh)(null)
      const questionsCount = elements.filter(
        (elem) => elem.type === "QUESTION"
      ).length
      const node = (
        <Result
          questionsCount={questionsCount}
          animateIndicator={animateResultIndicator}
          getSummaryText={getResultSummaryText}
          handleCTAButtonClick={handleResultCTAButtonClick}
          instanceRefHolder={resultRH}
        />
      )
      slideNode = /** @type {HTMLElement} */ (node)
      slideInstance = resultRH.ref
    }

    elementNodes.push(slideNode)
    elementInstances.push(slideInstance)
  })

  return { elementNodes, elementInstances }
}
