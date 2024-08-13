import { assertIsDefined } from "@/lib/value"
import Question from "@/components/question"
import Result from "@/components/result"

import type {
  QuizFinalizationData,
  QuizElementInstance,
  FinalizedQuizQuestionElement,
  FinalizedQuizInquiryElement
} from "./base"

function getQuizResultData(elementInstances: QuizElementInstance[]) {
  const questionInstances = elementInstances.filter(
    (element): element is Question => element instanceof Question
  )

  const gottenAnswersCount = questionInstances.reduce(
    (previousValue, instance) =>
      instance.correctAnswerIsPicked() ? previousValue + 1 : previousValue,
    0
  )

  return { gottenAnswersCount }
}

export function getQuizFinalizationData(
  finalizedElements: FinalizedQuizInquiryElement[]
): QuizFinalizationData {
  const questions = finalizedElements.filter(
    (e): e is FinalizedQuizQuestionElement => e.type === "QUESTION"
  )

  const questionsCount = questions.length
  const codeboardsCount = finalizedElements.length - questions.length
  const gottenAnswersCount = questions.filter(
    (e) => e.selectedOptionIndex === e.answerIndex
  ).length
  const percentScored = Number(
    ((gottenAnswersCount / questionsCount) * 100).toFixed(2)
  )

  return {
    codeboardsCount,
    questionsCount,
    correctAnswers: gottenAnswersCount,
    incorrectAnswers: questionsCount - gottenAnswersCount,
    percentScored,
    elementsCount: finalizedElements.length,
    elements: finalizedElements
  }
}

export function finalizeQuiz(
  elements: FinalizedQuizInquiryElement[],
  elementInstances: QuizElementInstance[]
) {
  elementInstances.forEach((instance, index) => {
    if (instance instanceof Result) {
      const { gottenAnswersCount } = getQuizResultData(elementInstances)
      instance.finalize(gottenAnswersCount)
    }

    if (!(instance instanceof Question)) return

    const elementData = elements[index]
    assertIsDefined(elementData, `finalized quiz data at index: ${index}`)
    if (elementData.type !== "QUESTION") return

    instance.finalize(elementData.selectedOptionIndex)
  })
}
