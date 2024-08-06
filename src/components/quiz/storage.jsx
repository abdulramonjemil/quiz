/**
 * @typedef {import("./base").QuizProps} QuizProps
 * @typedef {import("./base").QuizInquiryElement} QuizInquiryElement
 * @typedef {import("./base").FinalizedQuizInquiryElement} FinalizedQuizInquiryElement
 * @typedef {import("./base").DecodedStoredQuizData} DecodedStoredQuizData
 * @typedef {import("./base").DecodedStoredQuizElement} DecodedStoredQuizElement
 */

import { webStorageIsAvailable } from "@/lib/storage"
import { assertIsDefined } from "@/lib/value"

const QUIZ_DATA_STORE = "localStorage"

/** @param {Exclude<QuizProps["autosave"], null | undefined>} props */
export function getStorageKey(props) {
  const id = props.identifier
  const pathname = props.saveWithPathname ? window.location.pathname : "*"
  return `Quiz::id=${id}::pname=${pathname}`
}

/** @param {string} storageKey */
export function removeStoredQuizData(storageKey) {
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
 *
 * @param {FinalizedQuizInquiryElement[]} data
 */
function createStorableQuizData(data) {
  const representations = data.map((element) => {
    if (element.type === "QUESTION") {
      const { answerIndex, options, selectedOptionIndex } = element
      return `Q:${options.length}:${answerIndex}:${selectedOptionIndex}`
    }
    return `C:${element.language}`
  })
  return representations.join("--")
}

/**
 * Converts stored string to usable object
 *
 * @param {string} storedData
 * @return {DecodedStoredQuizData | null}
 */
function decodeStoredQuizData(storedData) {
  const split = storedData.split("--")

  const decoded = split.map((data) => {
    if (/^C:.{1,12}$/.test(data)) {
      const [, language] = data.split(":")
      return /** @type {DecodedStoredQuizElement} */ ({
        type: "CODE_BOARD",
        language
      })
    }

    if (/^Q:[2-4]:[0-3]:[0-3]$/.test(data)) {
      const numbers = data.split(":").slice(1)
      const [optionsCount, answerIndex, selectedOptionIndex] =
        /** @type {[number, number, number]} */ (numbers.map(Number))

      const invalidAnswerIndex = answerIndex > optionsCount - 1
      const invalidSelectedOptionIndex = selectedOptionIndex > optionsCount - 1
      if (invalidAnswerIndex || invalidSelectedOptionIndex) return null

      return /** @type {DecodedStoredQuizElement} */ ({
        type: "QUESTION",
        optionsCount,
        answerIndex,
        selectedOptionIndex
      })
    }
    return null
  })

  const filtered = decoded.filter(
    /** @returns {value is DecodedStoredQuizElement} */
    (value) => value !== null
  )

  if (filtered.length !== decoded.length) return null
  return { elements: filtered }
}

/** @param {string} storageKey */
export function getStoredQuizData(storageKey) {
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

/**
 * @param {DecodedStoredQuizData} data
 * @param {QuizInquiryElement[]} elements
 */
export function storedDataIsValidForQuiz(data, elements) {
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

/**
 * @param {FinalizedQuizInquiryElement[]} data
 * @param {string} storageKey
 */
export function storeQuizData(data, storageKey) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.setItem(storageKey, createStorableQuizData(data))
}
