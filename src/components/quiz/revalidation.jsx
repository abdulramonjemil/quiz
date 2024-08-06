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
      resultIndex
    }
  } = slideQuizData

  const resolvedLevelIndices = /** @type {number[]} */ ([])
  const unresolvedSet = new Set(unresolvedIndices)

  for (let i = 0; i <= lastElementIndex; i += 1) {
    if (unresolvedSet.has(i)) continue // eslint-disable-line no-continue
    if (i !== resultIndex || quizIsFinalized) {
      resolvedLevelIndices.push(i)
    }
  }

  return {
    activeLevelIndex: slideIndex,
    resolvedLevelIndices,
    highestEnabledLevelIndex: quizIsFinalized
      ? null
      : firstUnansweredQuestionIndex ?? resultIndex - 1
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
 */
export function revalidateQuiz({
  slideIndex,
  elementInstances,
  controlPanel,
  presentation,
  tabs,
  progress
}) {
  const appropriateSlideQuizData = getQuizDataForSlide(
    elementInstances,
    slideIndex
  )

  tabs.setActiveTab(quizElementIndexToTabName(slideIndex))
  presentation.revalidate({ shownSlideIndex: slideIndex })
  progress.revalidate(getProgressRevalidationOptions(appropriateSlideQuizData))
  controlPanel.revalidate(
    getControlPanelRevalidationOptions(appropriateSlideQuizData)
  )
}
