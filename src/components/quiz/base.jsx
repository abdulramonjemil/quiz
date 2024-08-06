import { assertIsInstance } from "@/lib/value"
import { cn } from "@/lib/dom"
import Result from "@/components/result"
import Question from "@/components/question"
import Styles from "@/scss/quiz.module.scss"

/**
 * @typedef {import("@/components/header").HeaderLevel} HeaderLevel
 * @typedef {import("@/components/question").QuestionProps} QuestionProps
 * @typedef {import("@/components/question").OptionIndex} QuestionOptionIndex
 * @typedef {import("@/components/code-board").CodeBoardProps} CodeBoardProps
 */

/**
 * @typedef {Omit<QuestionProps, "handleOptionChange"> & {
 *   type: "QUESTION"
 * }} QuizQuestionElement
 *
 * @typedef {{
 *   type: "CODE_BOARD",
 *   title: CodeBoardProps["title"],
 *   language: CodeBoardProps["language"],
 *   snippet: CodeBoardProps["snippet"]
 * }} QuizCodeBoardElement
 *
 * @typedef {{ type: "RESULT" }} QuizResultElement
 * @typedef {QuizQuestionElement | QuizCodeBoardElement} QuizInquiryElement
 * @typedef {QuizQuestionElement | QuizCodeBoardElement | QuizResultElement} QuizSlideElement
 *
 *
 * @typedef {QuizQuestionElement & {
 *   selectedOptionIndex: QuestionOptionIndex
 * }} FinalizedQuizQuestionElement
 *
 * @typedef {(
 *   | FinalizedQuizQuestionElement
 *   | QuizCodeBoardElement
 * )} FinalizedQuizInquiryElement
 *
 *
 * @typedef {{
 *   codeboardsCount: number,
 *   questionsCount: number,
 *   correctAnswers: number,
 *   incorrectAnswers: number,
 *   percentScored: number,
 *   elementsCount: number,
 *   elements: (FinalizedQuizInquiryElement)[]
 * }} QuizFinalizationData
 *
 *
 * @typedef {({
 *   type: "CODE_BOARD",
 *   language: string
 * } | {
 *   type: "QUESTION",
 *   optionsCount: number,
 *   answerIndex: QuestionOptionIndex,
 *   selectedOptionIndex: QuestionOptionIndex
 * })} DecodedStoredQuizElement
 *
 * @typedef {{
 *   elements: DecodedStoredQuizElement[]
 * }} DecodedStoredQuizData
 *
 * @typedef {{
 *   header: string,
 *   elements: (QuizInquiryElement | FinalizedQuizInquiryElement)[],
 *   finalized: boolean,
 *   onSubmit?: ((data: QuizFinalizationData) => void) | undefined,
 *   autosave?: {
 *     identifier: string,
 *     saveWithPathname: boolean
 *   } | null | undefined,
 *   customRootClass?: string | null | undefined,
 *   headerLevel?: HeaderLevel | null | undefined,
 *   codeBoardTheme?: CodeBoardProps["theme"],
 *   animateResultIndicator?: boolean | undefined,
 *   getResultSummaryText?: ((data: QuizFinalizationData) => string) | null | undefined
 * }} QuizProps
 *
 * @typedef {Question | Result | null} QuizElementInstance
 * @typedef {ReturnType<typeof getQuizDataForSlide>} SlideQuizData
 */

export const quizClasses = {
  root: cn("quiz", Styles.Quiz),
  inner: cn("quiz-inner", Styles.Quiz__Inner)
}

/** @param {string} tabName */
export function tabNameToQuizElementIndex(tabName) {
  return Number(tabName)
}

/** @param {number} index */
export function quizElementIndexToTabName(index) {
  return String(index)
}

/**
 * @param {QuizElementInstance[]} elementInstances
 * @param {number} slideIndex
 */
export function getQuizDataForSlide(elementInstances, slideIndex) {
  const slide = elementInstances[slideIndex]
  const resultIndex = elementInstances.length - 1
  const resultInstance = elementInstances[resultIndex]
  assertIsInstance(resultInstance, Result)

  const quizIsFinalized = resultInstance.isFinalized()
  const slideIsFirst = slideIndex === 0
  const slideIsLast = slideIndex === elementInstances.length - 1
  const slideIsResult = slide === resultInstance

  const slideIsQuestion = slide instanceof Question
  const slideIsAnsweredQuestion = slideIsQuestion && slide.isAnswered()

  const questionInstances = elementInstances.filter(
    /** @returns {element is Question} */ (element) =>
      element instanceof Question
  )

  const answeredQuestionIndices = /** @type {number[]} */ ([])
  const unansweredQuestionIndices = /** @type {number[]} */ ([])

  questionInstances.forEach((element, index) => {
    if (!(element instanceof Question)) return
    if (element.isAnswered()) answeredQuestionIndices.push(index)
    else unansweredQuestionIndices.push(index)
  })

  const firstUnansweredQuestionIndex = unansweredQuestionIndices[0] ?? null
  const precedesUnrenderedResult =
    !quizIsFinalized && slideIndex === resultIndex - 1

  const allowedNextIndex =
    slideIsLast ||
    precedesUnrenderedResult ||
    (firstUnansweredQuestionIndex !== null &&
      firstUnansweredQuestionIndex <= slideIndex)
      ? null
      : slideIndex + 1

  return {
    slide: {
      index: slideIndex,
      isAnsweredQuestion: slideIsAnsweredQuestion,
      isFirst: slideIsFirst,
      isLast: slideIsLast,
      isQuestion: slideIsQuestion,
      isResult: slideIsResult,
      allowedPrevIndex: slideIsFirst ? null : slideIndex - 1,
      allowedNextIndex,
      ref: slide
    },
    quiz: {
      answeredQuestionIndices,
      unansweredQuestionIndices,
      firstUnansweredQuestionIndex: unansweredQuestionIndices[0] ?? null,
      isFinalized: quizIsFinalized,
      lastElementIndex: elementInstances.length - 1,
      resultIndex
    }
  }
}
