import Progress, {
  type ProgressRevalidationOptions
} from "@/components/progress"

import ControlPanel, {
  type ControlPanelRevalidationOptions
} from "@/components/control-panel"

import Presentation from "@/components/presentation"
import type { Tabs } from "@/ui/tabs"

import {
  getQuizDataForSlide,
  quizElementIndexToTabName,
  type QuizAnswerSelectionMode,
  type SlideQuizData,
  type QuizElementInstance
} from "./base"

function getControlPanelRevalidationOptions(
  slideQuizData: SlideQuizData
): ControlPanelRevalidationOptions {
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

function getProgressRevalidationOptions(
  slideQuizData: SlideQuizData
): ProgressRevalidationOptions {
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

  const resolvedLevelIndices = [] as number[]
  const unresolvedSet = new Set(unresolvedIndices)

  for (let i = 0; i <= lastElementIndex; i += 1) {
    if (unresolvedSet.has(i)) continue // eslint-disable-line no-continue
    if (i !== resultIndex || quizIsFinalized) resolvedLevelIndices.push(i)
  }

  let highestEnabledIndex = null as number | null
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

export function revalidateQuiz({
  slideIndex,
  elementInstances,
  controlPanel,
  presentation,
  tabs,
  progress,
  answerSelectionMode
}: {
  slideIndex: number
  elementInstances: QuizElementInstance[]
  controlPanel: ControlPanel
  presentation: Presentation
  tabs: Tabs
  progress: Progress
  answerSelectionMode: QuizAnswerSelectionMode
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
