import { assertIsInstance } from "@/lib/value"
import { cn } from "@/lib/dom"
import Result from "@/components/result"
import Question from "@/components/question"
import Styles from "@/scss/quiz.module.scss"

import type { HeaderLevel } from "@/components/header"
import type { CodeBoardProps } from "@/components/code-board"
import type {
  QuestionProps,
  OptionIndex as QuestionOptionIndex
} from "@/components/question"

export interface QuizQuestionElement
  extends Pick<
    QuestionProps,
    "title" | "answerIndex" | "options" | "explanation"
  > {
  type: "QUESTION"
}

export interface QuizCodeBoardElement
  extends Pick<CodeBoardProps, "title" | "language" | "snippet"> {
  type: "CODE_BOARD"
}

export interface QuizResultElement {
  type: "RESULT"
}

export type QuizInquiryElement = QuizQuestionElement | QuizCodeBoardElement
export type QuizSlideElement =
  | QuizQuestionElement
  | QuizCodeBoardElement
  | QuizResultElement

export interface FinalizedQuizQuestionElement extends QuizQuestionElement {
  selectedOptionIndex: QuestionOptionIndex
}

export type FinalizedQuizInquiryElement =
  | QuizCodeBoardElement
  | FinalizedQuizQuestionElement

export interface QuizFinalizationData {
  codeboardsCount: number
  questionsCount: number
  correctAnswers: number
  incorrectAnswers: number
  percentScored: number
  elementsCount: number
  elements: FinalizedQuizInquiryElement[]
}

export interface DecodedStoredQuizCodeBoardElement {
  type: "CODE_BOARD"
  language: string
}

export interface DecodedStoredQuizQuestionElement {
  type: "QUESTION"
  optionsCount: number
  answerIndex: QuestionOptionIndex
  selectedOptionIndex: QuestionOptionIndex
}

export type DecodedStoredQuizElement =
  | DecodedStoredQuizCodeBoardElement
  | DecodedStoredQuizQuestionElement

export interface DecodedStoredQuizData {
  elements: DecodedStoredQuizElement[]
}

export type QuizAnswerSelectionMode = "sequential" | "free"

export interface QuizProps {
  // Storage options
  autosave?:
    | {
        identifier: string
        saveWithPathname: boolean
      }
    | null
    | undefined

  // Element options
  answerSelectionMode?: QuizAnswerSelectionMode | null | undefined
  finalized: boolean
  elements: (QuizInquiryElement | FinalizedQuizInquiryElement)[]

  // Header options
  header?: string | null | undefined
  headerLevel?: HeaderLevel | null | undefined

  // Quiz functionality options
  onSubmit?: ((data: QuizFinalizationData) => void) | undefined

  // Quiz root element options
  customRootClass?: string | null | undefined
  rootElementType?:
    | "div"
    | "section"
    | "main"
    | (string & {}) // eslint-disable-line @typescript-eslint/ban-types
    | undefined
    | null

  // Codeboard options
  codeBoardTheme?: CodeBoardProps["theme"]

  // Result options
  animateResultIndicator?: boolean | undefined
  getResultSummaryText?:
    | ((data: QuizFinalizationData) => string)
    | null
    | undefined
}

export type QuizElementInstance = Question | Result | null
export type SlideQuizData = ReturnType<typeof getQuizDataForSlide>

// ========================================================
// ================== VALUE EXPORTS =======================
// ========================================================

export const quizClasses = {
  root: cn("quiz", Styles.Quiz),
  inner: cn("quiz-inner", Styles.Quiz__Inner)
}

export function tabNameToQuizElementIndex(tabName: string) {
  return Number(tabName)
}

export function quizElementIndexToTabName(index: number) {
  return String(index)
}

export function getQuizDataForSlide(
  elementInstances: QuizElementInstance[],
  slideIndex: number,
  answerSelectionMode: QuizAnswerSelectionMode
) {
  const slide = elementInstances[slideIndex]
  const resultIndex = elementInstances.length - 1
  const resultInstance = elementInstances[resultIndex]
  assertIsInstance(resultInstance, Result)

  const quizIsFinalized = resultInstance.isFinalized()
  const slideIsFirst = slideIndex === 0
  const slideIsLast = slideIndex === elementInstances.length - 1
  const slideIsResult = slide === resultInstance

  const slideIsQuestion = slide instanceof Question
  const slideIsNotUnansweredQuestion = slideIsQuestion && slide.isAnswered()

  const answeredQuestionIndices = [] as number[]
  const unansweredQuestionIndices = [] as number[]

  elementInstances.forEach((element, index) => {
    if (!(element instanceof Question)) return
    if (element.isAnswered()) answeredQuestionIndices.push(index)
    else unansweredQuestionIndices.push(index)
  })

  const firstUnansweredQuestionIndex = unansweredQuestionIndices[0] ?? null
  const precedesUnrenderedResult =
    !quizIsFinalized && slideIndex === resultIndex - 1

  let allowedNextIndex = null as number | null

  if (answerSelectionMode === "sequential") {
    if (slideIsLast || precedesUnrenderedResult) {
      allowedNextIndex = null
    } else {
      const isNotBeforeUnanswered =
        firstUnansweredQuestionIndex !== null &&
        slideIndex >= firstUnansweredQuestionIndex
      allowedNextIndex = isNotBeforeUnanswered ? null : slideIndex + 1
    }
  } else if (answerSelectionMode === "free") {
    allowedNextIndex =
      slideIsLast || precedesUnrenderedResult ? null : slideIndex + 1
  }

  return {
    slide: {
      index: slideIndex,
      isNotUnansweredQuestion: slideIsNotUnansweredQuestion,
      isFirst: slideIsFirst,
      isLast: slideIsLast,
      isQuestion: slideIsQuestion,
      isResult: slideIsResult,
      allowedPrevIndex: slideIsFirst ? null : slideIndex - 1,
      allowedNextIndex,
      ref: slide
    },
    quiz: {
      resultIndex,
      answerSelectionMode,
      answeredQuestionIndices,
      unansweredQuestionIndices,
      firstUnansweredQuestionIndex: unansweredQuestionIndices[0] ?? null,
      isFinalized: quizIsFinalized,
      lastElementIndex: elementInstances.length - 1
    }
  }
}
