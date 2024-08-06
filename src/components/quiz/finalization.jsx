import { assertIsDefined } from "@/lib/value"
import Question from "@/components/question"
import Result from "@/components/result"

/**
 * @typedef {import("./base").QuizFinalizationData} QuizFinalizationData
 * @typedef {import("./base").QuizElementInstance} QuizElementInstance
 * @typedef {import("./base").FinalizedQuizInquiryElement} FinalizedQuizInquiryElement
 * @typedef {import("./base").FinalizedQuizQuestionElement} FinalizedQuizQuestionElement
 */

/** @param {QuizElementInstance[]} elementInstances */
function getQuizResultData(elementInstances) {
  const questionInstances = elementInstances.filter(
    /** @returns {element is Question} */ (element) =>
      element instanceof Question
  )

  const gottenAnswersCount = questionInstances.reduce(
    (previousValue, instance) =>
      instance.correctAnswerIsPicked() ? previousValue + 1 : previousValue,
    0
  )

  return { gottenAnswersCount }
}

/**
 * @param {FinalizedQuizInquiryElement[]} finalizedElements
 * @returns {QuizFinalizationData}
 */
export function getQuizFinalizationData(finalizedElements) {
  const questions = finalizedElements.filter(
    /** @returns {e is FinalizedQuizQuestionElement} */ (e) =>
      e.type === "QUESTION"
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

/**
 * @param {FinalizedQuizInquiryElement[]} elementConfigs
 * @param {QuizElementInstance[]} elementInstances
 */
export function finalizeQuiz(elementConfigs, elementInstances) {
  elementInstances.forEach((instance, index) => {
    if (instance instanceof Result) {
      const { gottenAnswersCount } = getQuizResultData(elementInstances)
      instance.finalize(gottenAnswersCount)
    }

    if (!(instance instanceof Question)) return
    const elementData = elementConfigs[index]
    assertIsDefined(elementData, `finalized quiz data at index: ${index}`)
    if (elementData.type !== "QUESTION") return
    instance.finalize(elementData.selectedOptionIndex)
  })
}
