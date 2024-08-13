import { rh } from "@/jsx"
import { assertCondition, assertIsDefined } from "@/lib/value"
import CodeBoard from "@/components/code-board"
import Question from "@/components/question"
import Result, { type ResultProps } from "@/components/result"

import {
  getStorageKey,
  getStoredQuizData,
  removeStoredQuizData,
  storedDataIsValidForQuiz
} from "./storage"

import type {
  QuizProps,
  QuizSlideElement,
  QuizInquiryElement,
  QuizElementInstance,
  FinalizedQuizInquiryElement,
  FinalizedQuizQuestionElement,
  DecodedStoredQuizElement
} from "./base"

function isFinalizedQuizInquiryElement(
  element: QuizInquiryElement | FinalizedQuizInquiryElement
): element is FinalizedQuizInquiryElement {
  if (element.type === "CODE_BOARD") return true
  if (element.type === "QUESTION") {
    const e = element as FinalizedQuizQuestionElement
    return (
      e.selectedOptionIndex >= 0 && e.selectedOptionIndex < e.options.length
    )
  }
  return false
}

export function decodedDataToFinalizedElement(
  decoded: DecodedStoredQuizElement[],
  elements: QuizInquiryElement[]
): FinalizedQuizInquiryElement[] {
  return elements.map((element, index) => {
    if (element.type === "CODE_BOARD") return element
    const d = decoded[index]
    const msg = `decoded data at index: ${index} is question`
    assertCondition(d?.type === "QUESTION", msg)
    return { ...element, selectedOptionIndex: d.selectedOptionIndex }
  })
}

export function assertValidQuizPropsElementConfig(
  elements: QuizInquiryElement[]
) {
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

export function getAvailableFinalizedElements({
  elements,
  elementInstances,
  previouslyFinalized,
  autoSaveConfig
}: {
  elements: (QuizInquiryElement | FinalizedQuizInquiryElement)[]
  elementInstances: QuizElementInstance[]
  previouslyFinalized: boolean
  autoSaveConfig: QuizProps["autosave"]
}): FinalizedQuizInquiryElement[] | null {
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
    .filter((e): e is Question => e instanceof Question)
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
    return {
      ...element,
      selectedOptionIndex
    } satisfies FinalizedQuizQuestionElement
  })
}

export function buildQuizSlideElements({
  elements,
  codeBoardTheme,
  animateResultIndicator,
  getResultSummaryText,
  handleQuestionOptionChange,
  handleResultCTAButtonClick
}: {
  elements: QuizSlideElement[]
  codeBoardTheme: QuizProps["codeBoardTheme"]
  getResultSummaryText: ResultProps["getSummaryText"]
  animateResultIndicator: QuizProps["animateResultIndicator"]
  handleQuestionOptionChange: () => void
  handleResultCTAButtonClick: ResultProps["handleCTAButtonClick"]
}) {
  const elementNodes: HTMLElement[] = []
  const elementInstances: QuizElementInstance[] = []

  elements.forEach((element) => {
    let slideNode: HTMLElement
    let slideInstance: QuizElementInstance

    if (element.type === "CODE_BOARD") {
      const node = (
        <CodeBoard
          title={element.title}
          language={element.language}
          snippet={element.snippet}
          theme={codeBoardTheme}
        />
      )
      slideNode = node as HTMLElement
      slideInstance = null
    } else if (element.type === "QUESTION") {
      const questionInstanceRH = rh<Question>(null)
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
      slideNode = node as HTMLElement
      slideInstance = questionInstanceRH.ref
    } else {
      const resultRH = rh<Result>(null)
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
      slideNode = node as HTMLElement
      slideInstance = resultRH.ref
    }

    elementNodes.push(slideNode)
    elementInstances.push(slideInstance)
  })

  return { elementNodes, elementInstances }
}
