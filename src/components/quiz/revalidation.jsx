import { getQuizDataForSlide, quizElementIndexToTabName } from "./base"

/**
 * @typedef {import("@/components/progress").ProgressRevalidationOptions} ProgressRevalidationOptions
 * @typedef {(
 *   import("@/components/control-panel").ControlPanelRevalidationOptions
 * )} ControlPanelRevalidationOptions
 *
 * @typedef {import("@/ui").Tabs} Tabs
 * @typedef {import("@/components/progress").default} Progress
 * @typedef {import("@/components/presentation").default} Presentation
 * @typedef {import("@/components/control-panel").default} ControlPanel
 *
 * @typedef {import("./base").QuizAnswerSelectionMode} QuizAnswerSelectionMode
 * @typedef {import("./base").SlideQuizData} SlideQuizData
 * @typedef {import("./base").QuizElementInstance} QuizElementInstance
 */

/**
 * @param {SlideQuizData} slideQuizData
 * @returns {ControlPanelRevalidationOptions}
 */
function getControlPanelRevalidationOptions(slideQuizData) {
  const {
    isFinalized: quizIsFinalized,
    firstUnansweredQuestionIndex: firstUnansweredQuizQuestionIndex
  } = slideQuizData.quiz
  const { allowedPrevIndex, allowedNextIndex } = slideQuizData.slide

  return {
    prev: allowedPrevIndex !== null,
    next: allowedNextIndex !== null,
    cta: {
      isSubmit: !quizIsFinalized,
      isEnabled:
        (!quizIsFinalized && firstUnansweredQuizQuestionIndex === null) ||
        (quizIsFinalized && !slideQuizData.slide.isResult)
    }
  }
}

/**
 * @param {SlideQuizData} slideQuizData
 * @returns {ProgressRevalidationOptions}
 */
function getProgressRevalidationOptions(slideQuizData) {
  const {
    slide: { index: slideIndex },
    quiz: {
      firstUnansweredQuestionIndex,
      lastElementIndex,
      unansweredQuestionIndices: unresolvedIndices,
      isFinalized: quizIsFinalized,
      resultIndex,
      answerSelectionMode
    }
  } = slideQuizData

  const resolvedLevelIndices = /** @type {number[]} */ ([])
  const unresolvedSet = new Set(unresolvedIndices)

  for (let i = 0; i <= lastElementIndex; i += 1) {
    if (unresolvedSet.has(i)) continue // eslint-disable-line no-continue
    if (i !== resultIndex || quizIsFinalized) resolvedLevelIndices.push(i)
  }

  let highestEnabledIndex = /** @type {number | null} */ (null)
  if (quizIsFinalized) {
    highestEnabledIndex = null
  } else if (answerSelectionMode === "sequential") {
    highestEnabledIndex = firstUnansweredQuestionIndex ?? resultIndex - 1
  } else if (answerSelectionMode === "free") {
    highestEnabledIndex = resultIndex - 1
  }

  return {
    activeLevelIndex: slideIndex,
    resolvedLevelIndices,
    highestEnabledLevelIndex: highestEnabledIndex
  }
}

/**
 * @param {Object} param0
 * @param {number} param0.slideIndex
 * @param {QuizElementInstance[]} param0.elementInstances
 * @param {ControlPanel} param0.controlPanel
 * @param {Presentation} param0.presentation
 * @param {Tabs} param0.tabs
 * @param {Progress} param0.progress
 * @param {QuizAnswerSelectionMode} param0.answerSelectionMode
 */
export function revalidateQuiz({
  slideIndex,
  elementInstances,
  controlPanel,
  presentation,
  tabs,
  progress,
  answerSelectionMode
}) {
  const appropriateSlideQuizData = getQuizDataForSlide(
    elementInstances,
    slideIndex,
    answerSelectionMode
  )

  tabs.setActiveTab(quizElementIndexToTabName(slideIndex))
  presentation.revalidate({ shownSlideIndex: slideIndex })
  progress.revalidate(getProgressRevalidationOptions(appropriateSlideQuizData))
  controlPanel.revalidate(
    getControlPanelRevalidationOptions(appropriateSlideQuizData)
  )
}
