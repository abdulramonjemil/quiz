import { webStorageIsAvailable } from "@/lib/storage"
import { assertIsDefined } from "@/lib/value"

import type {
  QuizProps,
  QuizInquiryElement,
  FinalizedQuizInquiryElement,
  DecodedStoredQuizData,
  DecodedStoredQuizElement
} from "./base"

const QUIZ_DATA_STORE = "localStorage"

export function getStorageKey(props: NonNullable<QuizProps["autosave"]>) {
  const id = props.identifier
  const pathname = props.saveWithPathname ? window.location.pathname : "*"
  return `Quiz::id=${id}::pname=${pathname}`
}

export function removeStoredQuizData(storageKey: string) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.removeItem(storageKey)
}

/**
 * Represents minimal quiz data as a string.
 * C:php =>
 *   - Codeboard element
 *   - In PHP (language)
 * Q:4:2:3 =>
 *   - Question element
 *   - 4 options
 *   - 2 is index of answer
 *   - 3 is index of selected answer
 */
function createStorableQuizData(elements: FinalizedQuizInquiryElement[]) {
  const representations = elements.map((element) => {
    if (element.type === "QUESTION") {
      const { answerIndex, options, selectedOptionIndex } = element
      return `Q:${options.length}:${answerIndex}:${selectedOptionIndex}`
    }
    return `C:${element.language}`
  })
  return representations.join("--")
}

/** Converts stored string to usable object */
function decodeStoredQuizData(
  storedData: string
): DecodedStoredQuizData | null {
  const split = storedData.split("--")

  const decoded = split.map((data) => {
    if (/^C:.{1,12}$/.test(data)) {
      const [, language] = data.split(":")
      return {
        type: "CODE_BOARD",
        language: language!
      } satisfies DecodedStoredQuizElement
    }

    if (/^Q:[2-4]:[0-3]:[0-3]$/.test(data)) {
      const numbers = data.split(":").slice(1)
      const [optionsCount, answerIndex, selectedOptionIndex] = numbers.map(
        Number
      ) as [number, number, number]

      const invalidAnswerIndex = answerIndex > optionsCount - 1
      const invalidSelectedOptionIndex = selectedOptionIndex > optionsCount - 1
      if (invalidAnswerIndex || invalidSelectedOptionIndex) return null

      return {
        type: "QUESTION",
        optionsCount,
        answerIndex,
        selectedOptionIndex
      } satisfies DecodedStoredQuizElement
    }
    return null
  })

  const filtered = decoded.filter(
    (value): value is DecodedStoredQuizElement => value !== null
  )

  if (filtered.length !== decoded.length) return null
  return { elements: filtered }
}

export function getStoredQuizData(storageKey: string) {
  const data = webStorageIsAvailable(QUIZ_DATA_STORE)
    ? window.localStorage.getItem(storageKey)
    : null

  if (!data) return null

  const decodingResult = decodeStoredQuizData(data)
  if (!decodingResult) {
    removeStoredQuizData(storageKey)
    return null
  }

  return decodingResult
}

export function storedDataIsValidForQuiz(
  data: DecodedStoredQuizData,
  elements: QuizInquiryElement[]
) {
  const decodedElements = data.elements
  if (decodedElements.length !== elements.length) return false
  return decodedElements.every((decodedElement, index) => {
    const suppliedElement = elements[index]
    assertIsDefined(suppliedElement, `quiz element config at pos: ${index}`)
    let elementsMatch = false

    if (decodedElement.type === "CODE_BOARD") {
      elementsMatch =
        suppliedElement.type === "CODE_BOARD" &&
        decodedElement.language === suppliedElement.language
    } else if (decodedElement.type === "QUESTION") {
      elementsMatch =
        suppliedElement.type === "QUESTION" &&
        decodedElement.optionsCount === suppliedElement.options.length &&
        decodedElement.answerIndex === suppliedElement.answerIndex
    }
    return elementsMatch
  })
}

export function storeQuizData(
  elements: FinalizedQuizInquiryElement[],
  storageKey: string
) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.setItem(storageKey, createStorableQuizData(elements))
}
