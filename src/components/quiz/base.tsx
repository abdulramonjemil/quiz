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

// Instances of quiz elements. Elements with no instance e.g. CodeBoard use `null`
export type QuizElementInstance = Question | Result | null

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
