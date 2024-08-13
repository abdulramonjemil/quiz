import { assertIsInstance } from "@/lib/value"
import Result from "@/components/result"
import Question from "@/components/question"
import type { QuizElementInstance, QuizAnswerSelectionMode } from "./base"

export type SlideQuizData = ReturnType<typeof getQuizDataForSlide>

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
