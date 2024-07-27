import { uniqueId } from "@/lib/id"
import { webStorageIsAvailable } from "@/lib/storage"
import { attemptElementFocus } from "@/lib/dom"
import { assertIsDefined, assertIsInstance } from "@/lib/value"
import { Tabs } from "@/ui/tabs"

import Component, { createInstanceRefHolder } from "@/core/component"
import Styles from "@/scss/quiz.module.scss"

/* Must be imported after importing styles above to allow overrides */
import Header from "./header"
import Progress from "./progress"
import Presentation from "./presentation"
import Question from "./question"
import CodeBoard from "./code-board"
import Result from "./result"
import ControlPanel from "./control-panel"

/**
 * @typedef {import("./control-panel").ControlPanelRevalidationOptions} ControlPanelRevalidationOptions
 * @typedef {import("./question").AnswerSelectionData} QuestionAnswerSelectionData
 * @typedef {import("./progress").ProgressRevalidationOptions} ProgressRevalidationOptions
 * @typedef {import("./question").OptionIndex} QuestionOptionIndex
 * @typedef {import("./question").QuestionProps} QuestionProps
 * @typedef {import("./code-board").CodeBoardProps} CodeBoardProps
 * @typedef {import("./result").ResultProps} ResultProps
 * @typedef {import("@/ui/tabs").TabChangeHandler} TabChangeHandler
 */

/**
 * @typedef {{
 *   answerSelectionDataset: QuestionAnswerSelectionData[];
 *   elementsCount: number;
 * }} ExportedQuizData
 *
 * @typedef {{
 *   type: "QUESTION",
 *   title: QuestionProps["title"]
 *   answerIndex: QuestionProps["answerIndex"]
 *   options: QuestionProps["options"]
 *   explanation: QuestionProps["explanation"]
 * }} QuizQuestionElement
 *
 * @typedef {{
 *   type: "CODE_BOARD",
 *   title: CodeBoardProps["title"],
 *   language: CodeBoardProps["language"],
 *   snippet: CodeBoardProps["snippet"]
 * }} QuizCodeBoardElement
 *
 * @typedef {{ type: "RESULT" }} QuizResultElement
 * @typedef {QuizQuestionElement | QuizCodeBoardElement} QuizPropElement
 * @typedef {QuizQuestionElement | QuizCodeBoardElement | QuizResultElement} QuizSlideElement
 *
 *
 * @typedef {QuizQuestionElement & {
 *   selectedOptionIndex: QuestionOptionIndex
 * }} FinalizedQuizQuestionElement
 *
 * @typedef {(
 *   | FinalizedQuizQuestionElement
 *   | QuizCodeBoardElement
 * )} FinalizedQuizInquiryElement
 *
 *
 * @typedef {({
 *   type: "CODE_BOARD",
 *   language: string
 * } | {
 *   type: "QUESTION",
 *   optionsCount: number,
 *   answerIndex: QuestionOptionIndex,
 *   selectedOptionIndex: QuestionOptionIndex
 * })} DecodedStoredQuizElement
 *
 * @typedef {{
 *   elements: DecodedStoredQuizElement[]
 * }} DecodedStoredQuizData
 *
 *
 * @typedef {{
 *   elements: QuizPropElement[],
 *   submissionCallback: (data: ExportedQuizData) => void,
 *   metadata?: {
 *     autoSave?: boolean | undefined,
 *     resultData?: ExportedQuizData | null | undefined,
 *     header?: string | undefined,
 *     isGlobal?: boolean | undefined,
 *     storageKey?: string | undefined
 *   } | undefined
 * }} QuizProps
 *
 * @typedef {Question | Result | null} QuizElementInstance
 * @typedef {typeof Quiz} QuizClass
 *
 * @typedef {ReturnType<typeof getQuizDataForSlide>} SlideQuizData
 * @typedef {{ prev: number | null, next: number | null }} PrevNextIndices
 */

const DEFAULT_QUIZ_METADATA = {
  AUTO_SAVE: true,
  STORED_DATA: null,
  HEADER: "Test your knowledge",
  IS_GLOBAL: false,
  STORAGE_KEY: ""
}

const QUIZ_DATA_STORE = "localStorage"

/** @param {QuizProps["metadata"]} metadata  */
function normalizeQuizMetadataConfig(metadata) {
  const { AUTO_SAVE, STORED_DATA, HEADER, IS_GLOBAL, STORAGE_KEY } =
    DEFAULT_QUIZ_METADATA

  if (metadata?.isGlobal === true && typeof metadata?.storageKey !== "string") {
    throw new Error("Storage key is required for a global quiz")
  }

  const globalizationValue = metadata?.isGlobal ?? IS_GLOBAL
  return {
    autoSave: metadata?.autoSave ?? AUTO_SAVE,
    resultData: metadata?.resultData ?? STORED_DATA,
    header: metadata?.header ?? HEADER,
    storageKey:
      // eslint-disable-next-line prefer-template
      "QUIZDATA" +
      `@k=>${metadata?.storageKey ?? STORAGE_KEY}` +
      (globalizationValue === true ? "" : `@p=>${window.location.pathname}`)
  }
}

/**
 * @param {QuizPropElement[]} elements
 */
function assertValidQuizPropsElementConfig(elements) {
  const elementsCount = elements.length
  if (elementsCount < 1 || elementsCount > 5)
    throw new TypeError("There can only be 1 to 5 quiz elements")

  const lastQuizElement = elements[elementsCount - 1]
  if (lastQuizElement.type !== "QUESTION") {
    throw new TypeError("The last element in a quiz must be a question")
  }
}

/**
 * @param {{
 *   elements: QuizSlideElement[],
 *   handleQuestionOptionChange: () => void,
 *   handleResultExplanationBtnClick: ResultProps["handleExplanationBtnClick"]
 * }} param0
 */
function buildQuizSlideElements({
  elements,
  handleQuestionOptionChange,
  handleResultExplanationBtnClick
}) {
  /** @type {HTMLElement[]} */
  const elementNodes = []
  /** @type {QuizElementInstance[]} */
  const elementInstances = []

  elements.forEach((element) => {
    /** @type {HTMLElement} */
    let slideNode
    /** @type {QuizElementInstance} */
    let slideInstance

    if (element.type === "CODE_BOARD") {
      slideNode = (
        <CodeBoard
          snippet={element.snippet}
          language={element.language}
          title={element.title}
        />
      )
      slideInstance = null
    } else if (element.type === "QUESTION") {
      const questionInstanceRefHolder = createInstanceRefHolder()
      slideNode = (
        <Question
          title={element.title}
          options={element.options}
          answerIndex={element.answerIndex}
          explanation={element.explanation}
          handleOptionChange={handleQuestionOptionChange}
          refHolder={questionInstanceRefHolder}
        />
      )
      slideInstance = questionInstanceRefHolder.ref
    } else if (element.type === "RESULT") {
      const resultInstanceRefHolder = createInstanceRefHolder()
      const questionsCount = elements.filter(
        (elem) => elem.type === "QUESTION"
      ).length

      slideNode = (
        <Result
          questionsCount={questionsCount}
          handleExplanationBtnClick={handleResultExplanationBtnClick}
          refHolder={resultInstanceRefHolder}
        />
      )
      slideInstance = resultInstanceRefHolder.ref
    }

    elementNodes.push(slideNode)
    elementInstances.push(slideInstance)
  })

  return { elementNodes, elementInstances }
}

/** @param {string} storageKey */
function removeStoredQuizData(storageKey) {
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
 * @return {DecodedStoredQuizData}
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
      const numbers = /** @type {number[]} */ (data.split(":").slice(1))
      const [optionsCount, answerIndex, selectedOptionIndex] =
        numbers.map(Number)

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
function getStoredQuizData(storageKey) {
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
 * @param {ExportedQuizData} data
 * @param {QuizPropElement[]} quizElements
 */
function resultDataIsValidForQuiz(data, quizElements) {
  const { answerSelectionDataset, elementsCount } = data
  const questionElements = quizElements.filter(
    (element) => element.type === "QUESTION"
  )

  return (
    answerSelectionDataset.length === questionElements.length &&
    elementsCount === quizElements.length &&
    answerSelectionDataset.every(
      (d, index) =>
        d.selectedOptionIndex < questionElements[index].options.length
    )
  )
}

/**
 * @param {DecodedStoredQuizData} data
 * @param {QuizPropElement[]} elements
 */
function storedDataIsValidForQuiz(data, elements) {
  const decodedElements = data.elements
  if (decodedElements.length !== elements.length) return false
  return decodedElements.every((decodedElement, index) => {
    const suppliedElement = elements[index]
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
function storeQuizData(data, storageKey) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.setItem(storageKey, createStorableQuizData(data))
}

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
 * @param {QuizElementInstance[]} elementInstances
 * @param {number} slideIndex
 */
function getQuizDataForSlide(elementInstances, slideIndex) {
  const slide = elementInstances[slideIndex]
  const resultIndex = elementInstances.length - 1
  const resultInstance = elementInstances[resultIndex]
  assertIsInstance(resultInstance, Result)

  const quizIsFinalized = resultInstance.isFinalized()
  const slideIsFirst = slideIndex === 0
  const slideIsLast = slideIndex === elementInstances.length - 1
  const slideIsResult = slide === resultInstance

  const slideIsQuestion = slide instanceof Question
  const slideIsAnsweredQuestion = slideIsQuestion && slide.isAnswered()

  const indexOfNextQuizQuestion = elementInstances.findIndex(
    (element) => element instanceof Question && !element.isAnswered()
  )

  return {
    slide: {
      index: slideIndex,
      isAnsweredQuestion: slideIsAnsweredQuestion,
      isFirst: slideIsFirst,
      isLast: slideIsLast,
      isQuestion: slideIsQuestion,
      isResult: slideIsResult,
      ref: slide
    },
    quiz: {
      indexOfNextQuestion:
        indexOfNextQuizQuestion < 0 ? null : indexOfNextQuizQuestion,
      isFinalized: quizIsFinalized,
      resultIndex
    }
  }
}

/**
 * @param {SlideQuizData} slideQuizData
 * @param {PrevNextIndices} indices
 * @returns {ControlPanelRevalidationOptions}
 */
function getControlPanelRevalidationOptions(slideQuizData, indices) {
  const {
    isFinalized: quizIsFinalized,
    indexOfNextQuestion: indexOfNextQuizQuestion
  } = slideQuizData.quiz

  return {
    prev: indices.prev !== null,
    next: indices.next !== null,
    cta: {
      isSubmit: !quizIsFinalized,
      isEnabled:
        (!quizIsFinalized && indexOfNextQuizQuestion === null) ||
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
      indexOfNextQuestion: indexOfNextQuizQuestion,
      isFinalized: quizIsFinalized,
      resultIndex
    }
  } = slideQuizData

  return {
    activeLevelIndex: slideIndex,
    highestEnabledLevelIndex: quizIsFinalized
      ? null
      : indexOfNextQuizQuestion ?? resultIndex - 1
  }
}

/**
 * @param {SlideQuizData} slideQuizData
 * @returns {PrevNextIndices}
 */
function getSlidePrevNextIndices(slideQuizData) {
  const { index, isFirst, isLast } = slideQuizData.slide
  const { isFinalized, resultIndex, indexOfNextQuestion } = slideQuizData.quiz
  const precedesUnrenderedResult = !isFinalized && index === resultIndex - 1

  return {
    prev: isFirst ? null : index - 1,
    next:
      isLast ||
      precedesUnrenderedResult ||
      (indexOfNextQuestion !== null && indexOfNextQuestion <= index)
        ? null
        : index + 1
  }
}

/** @param {string} tabName */
function tabNameToQuizElementIndex(tabName) {
  return Number(tabName)
}

/** @param {number} index */
function quizElementIndexToTabName(index) {
  return String(index)
}

/**
 * @param {Object} param0
 * @param {string} param0.tablistLabel
 * @param {QuizSlideElement[]} param0.elements
 * @param {Presentation} param0.presentation
 * @param {Progress} param0.progress
 * @param {TabChangeHandler} param0.tabChangeHandler
 * @param {number} param0.defaultTabIndex
 */
function setupQuizTabs({
  tablistLabel,
  elements,
  presentation,
  progress,
  tabChangeHandler,
  defaultTabIndex
}) {
  const progressElements = progress.elements()
  const presentationSlides = presentation.slideNodes()

  const qElementToIndexMap = new Map(
    elements
      .filter((element) => element.type === "QUESTION")
      .map((element, index) => [element, index])
  )

  const codeToIndexMap = new Map(
    elements
      .filter((element) => element.type === "CODE_BOARD")
      .map((element, index) => [element, index])
  )

  return new Tabs({
    onTabChange: tabChangeHandler,
    defaultTabName: quizElementIndexToTabName(defaultTabIndex),
    elements: {
      tablist: {
        ref: progressElements.listRoot,
        ariaLabel: tablistLabel
      },
      tabItems: elements.map((element, index) => {
        const elementTabName = quizElementIndexToTabName(index)
        const triggerId = uniqueId()
        const contentId = uniqueId()

        let triggerAriaLabel = ""
        if (element.type === "QUESTION") {
          triggerAriaLabel = `Question ${qElementToIndexMap.get(element) + 1}`
        } else if (element.type === "CODE_BOARD") {
          triggerAriaLabel = `Code Sample ${codeToIndexMap.get(element) + 1}`
        } else if (element.type === "RESULT") {
          triggerAriaLabel = "Result"
        }

        return {
          name: elementTabName,
          triggerAriaLabel,
          triggerId,
          contentId,
          refs: {
            trigger: progressElements.buttons[index],
            content: presentationSlides[index]
          }
        }
      })
    }
  })
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
function revalidateQuiz({
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
  presentation.revalidate({ activeSlide: slideIndex })
  progress.revalidate(getProgressRevalidationOptions(appropriateSlideQuizData))
  controlPanel.revalidate(
    getControlPanelRevalidationOptions(
      appropriateSlideQuizData,
      getSlidePrevNextIndices(appropriateSlideQuizData)
    )
  )
}

const createQuizShortcutHandlers = (() => {
  /**
   * @typedef {{
   *   pressedNumber: number | null,
   *   pressedNumberIsUsed: boolean
   * }} MutableShortcutData
   *
   * @typedef {() => {
   *   elementInstances: QuizElementInstance[],
   *   controlPanel: ControlPanel,
   *   presentation: Presentation,
   *   progress: Progress,
   *   tabs: Tabs
   * }} QuizDataGetter
   *
   * @typedef {(
   *   quizDataGetter: QuizDataGetter,
   *   mutableShortcutData: MutableShortcutData,
   *   event: KeyboardEvent
   * ) => void} QuizShortcutKeyboardEventHandler
   */

  /** @type {QuizShortcutKeyboardEventHandler} */
  const shortcutKeyDownHandler = (getter, mutableShortcutData, event) => {
    const { controlPanel, presentation, progress, elementInstances, tabs } =
      getter.call(null)
    const mutableData = mutableShortcutData

    // Shortcut to select question answer
    if (["a", "b", "c", "d"].includes(event.key.toLowerCase())) {
      const slideIndex = presentation.currentSlideIndex()
      const slideData = getQuizDataForSlide(elementInstances, slideIndex)

      if (slideData.slide.isQuestion) {
        assertIsInstance(slideData.slide.ref, Question)
        const index = ["a", "b", "c", "d"].findIndex(
          (letter) => letter === event.key.toLowerCase()
        )
        slideData.slide.ref.simulateClick({ type: "option", index })
      }
      return
    }

    // Shortcut to go to next/prev quiz element
    if (["p", "n"].includes(event.key.toLowerCase())) {
      const button = { p: "prev", n: "next" }[event.key.toLowerCase()]
      const focused = controlPanel.simulateClick(button)
      if (focused) attemptElementFocus(tabs.activeTab().content)
      return
    }

    // Shortcut to show explanation for answered question
    if (event.key.toLowerCase() === "e") {
      const currentSlideIndex = presentation.currentSlideIndex()
      const slideData = getQuizDataForSlide(elementInstances, currentSlideIndex)

      if (slideData.quiz.isFinalized && slideData.slide.isQuestion) {
        assertIsInstance(slideData.slide.ref, Question)
        slideData.slide.ref.simulateClick({ type: "toggle" })
      }

      return
    }

    // Shortcut to show result
    if (event.key.toLocaleLowerCase() === "r") {
      const currentSlideIndex = presentation.currentSlideIndex()
      const slideData = getQuizDataForSlide(elementInstances, currentSlideIndex)

      if (slideData.quiz.isFinalized) {
        progress.simulateClick(slideData.quiz.resultIndex)
      }

      return
    }

    /**
     * - Shortcut to jump to specific quiz element based on number
     *
     * If the key is a number, we only jump to the slide at the number if
     * there is no other slide that begin with the same number. See comment
     * above key up handler below.
     */
    if (/\d/.test(event.key)) {
      const levelsCount = progress.levelsCount()
      if (!mutableData.pressedNumber) {
        if (levelsCount < Number(event.key) * 10) {
          progress.simulateClick(Number(event.key) - 1)
        } else {
          mutableData.pressedNumber = Number(event.key)
        }
      } else {
        mutableData.pressedNumberIsUsed = true
        progress.simulateClick(
          mutableData.pressedNumber * 10 + Number(event.key) - 1
        )
      }
    }
  }

  /**
   * If multiple slide positions begin with a number, when the number is
   * clicked, we don't immediately jump to the slide at that position until the
   * key is released, or another key is pressed. For example, if there are 12
   * slides, pressing on 1 doesn't jump to the first slide immediately because
   * the intended slide can be 1, 11, or 12. If the key is released, we jump to
   * 1, else if another key is pressed (1 or 2) while holding down 1 (1 can be
   * pressed down to mean two 1's), we jump to the appropriate position.
   *
   * @type {QuizShortcutKeyboardEventHandler}
   */
  const shortcutKeyUpHandler = (getter, mutableShortcutData, event) => {
    const { progress } = getter.call(null)
    const mutableData = mutableShortcutData
    const { pressedNumber, pressedNumberIsUsed } = mutableData
    if (Number(event.key) !== pressedNumber) return

    if (!pressedNumberIsUsed) {
      progress.simulateClick(pressedNumber - 1)
    }

    mutableData.pressedNumber = null
    mutableData.pressedNumberIsUsed = false
  }

  /** @param {QuizDataGetter} quizDataGetter */
  return (quizDataGetter) => {
    /** @type {MutableShortcutData} */
    const mutableData = {
      pressedNumber: null,
      pressedNumberIsUsed: false
    }

    return {
      keydown: shortcutKeyDownHandler.bind(null, quizDataGetter, mutableData),
      keyup: shortcutKeyUpHandler.bind(null, quizDataGetter, mutableData)
    }
  }
})()

/**
 * @template {QuizProps} Props
 * @extends {Component<Props>}
 */
export default class Quiz extends Component {
  /**
   * @param {{
   *   props: QuizProps,
   *   container?: Element | undefined
   * }} param0
   */
  static create({ props, container }) {
    const containerIsElementInstance = container instanceof Element
    const quizInstanceRefHolder = createInstanceRefHolder()
    const quizElement = <Quiz {...props} refHolder={quizInstanceRefHolder} />
    if (containerIsElementInstance) container.replaceChildren(quizElement)
    return [quizElement, quizInstanceRefHolder.ref]
  }

  /** @param {"prev" | "next"} button */
  $handleCPanelBtnClick(button) {
    const { $elementInstances, $presentation } = this
    const currentSlideData = getQuizDataForSlide(
      $elementInstances,
      $presentation.currentSlideIndex()
    )

    const { prev, next } = getSlidePrevNextIndices(currentSlideData)
    const appropriateIndex = button === "prev" ? prev : next
    if (typeof appropriateIndex !== "number") return
    this.$revalidate(appropriateIndex)
  }

  $handleCPanelSubmitCTAClick() {
    const { $elementInstances, $metadata } = this
    const { submissionCallback } = this.$props

    const resultIndex = $elementInstances.length - 1
    const resultInstance = $elementInstances[$elementInstances.length - 1]
    assertIsInstance(resultInstance, Result)

    const { gottenAnswersCount } = getQuizResultData($elementInstances)
    resultInstance.finalize(gottenAnswersCount)

    const questionInstances = $elementInstances.filter(
      /** @returns {element is Question} */ (element) =>
        element instanceof Question
    )

    questionInstances.forEach((questionElement) => questionElement.finalize())
    this.$revalidate(resultIndex)

    const answerSelectionDataset = questionInstances.map((questionElement) => {
      const data = questionElement.getAnswerSelectionData()
      assertIsDefined(data, "answer selection data")
      return data
    })

    /** @type {ExportedQuizData} */
    const quizData = {
      answerSelectionDataset,
      // Subtract 1 to exclude the added result element
      elementsCount: $elementInstances.length - 1
    }

    let questionIndex = -1
    const finalizedElements = this.$props.elements.map((element) => {
      if (element.type === "CODE_BOARD") return element
      questionIndex += 1
      const { selectedOptionIndex } = answerSelectionDataset[questionIndex]
      return /** @type {FinalizedQuizQuestionElement} */ ({
        ...element,
        selectedOptionIndex
      })
    })

    if ($metadata.autoSave) {
      storeQuizData(finalizedElements, $metadata.storageKey)
    }
    if (typeof submissionCallback === "function") {
      submissionCallback.call(this, quizData)
    }
  }

  $handleCPanelResultJumpCTAClick() {
    const { $elementInstances } = this
    const resultIndexIfPresent = $elementInstances.length - 1
    this.$revalidate(resultIndexIfPresent)
  }

  /** @param {number} levelIndex */
  $handleProgressButtonClick(levelIndex) {
    this.$revalidate(levelIndex)
  }

  $handleQuestionOptionChange() {
    const currentSlideIndex = this.$presentation.currentSlideIndex()
    this.$revalidate(currentSlideIndex)
  }

  $handleResultExplanationBtnClick() {
    this.$revalidate(0)
    attemptElementFocus(this.$composedNode)
  }

  /** @type {TabChangeHandler} */
  $handleTabChange(newTabname, _, source) {
    if (source !== "event") return
    this.$revalidate(tabNameToQuizElementIndex(newTabname))
  }

  $render() {
    const { elements } = /** @type {QuizProps} */ (this.$props)

    const {
      autoSave: autoSaveIsEnabled,
      resultData,
      header,
      storageKey
    } = normalizeQuizMetadataConfig(this.$props.metadata)

    assertValidQuizPropsElementConfig(elements)

    /** @type {QuizSlideElement[]} */
    const fullQuizElements = [...elements, { type: "RESULT" }]
    const { elementNodes, elementInstances } = buildQuizSlideElements({
      elements: fullQuizElements,
      handleQuestionOptionChange: this.$handleQuestionOptionChange.bind(this),
      handleResultExplanationBtnClick:
        this.$handleResultExplanationBtnClick.bind(this)
    })

    const resultIndex = elementInstances.length - 1
    const resultInstance = elementInstances[resultIndex]
    assertIsInstance(resultInstance, Result)

    if (resultData) {
      if (!resultDataIsValidForQuiz(resultData, elements)) {
        throw new Error(
          "Invalid quiz data supplied:\n\n" +
            `${JSON.stringify(resultData, null, 2)}`
        )
      } else {
        const { answerSelectionDataset } = resultData
        let questionIndex = -1

        elementInstances.forEach((instance) => {
          if (!(instance instanceof Question)) return
          questionIndex += 1
          const { selectedOptionIndex } = answerSelectionDataset[questionIndex]
          instance.finalize(selectedOptionIndex)
        })

        const { gottenAnswersCount } = getQuizResultData(elementInstances)
        resultInstance.finalize(gottenAnswersCount)
      }
    } else if (autoSaveIsEnabled) {
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
        } else {
          elementInstances.forEach((instance, index) => {
            if (!(instance instanceof Question)) return
            const storedQData = storedData.elements[index]
            if (storedQData.type !== "QUESTION") return
            instance.finalize(storedQData.selectedOptionIndex)
          })

          const { gottenAnswersCount } = getQuizResultData(elementInstances)
          resultInstance.finalize(gottenAnswersCount)
        }
      }
    }

    const quizLabellingId = uniqueId()
    const presentationControllingId = uniqueId()

    const progressRefHolder = createInstanceRefHolder()
    const presentationRefHolder = createInstanceRefHolder()
    const controlPanelRefHolder = createInstanceRefHolder()
    let tabs = /** @type {Tabs | null} */ (null)

    const shortcutHandlers = createQuizShortcutHandlers(() => {
      assertIsInstance(tabs, Tabs)
      return {
        elementInstances,
        controlPanel: controlPanelRefHolder.ref,
        presentation: presentationRefHolder.ref,
        progress: progressRefHolder.ref,
        tabs
      }
    })

    const quizNode = (
      <section
        aria-labelledby={quizLabellingId}
        className={Styles.Quiz}
        tabIndex={-1}
        onKeyDownCapture={shortcutHandlers.keydown}
        onKeyUpCapture={shortcutHandlers.keyup}
      >
        <Header labellingId={quizLabellingId}>{header}</Header>
        <Progress
          handleLevelButtonClick={this.$handleProgressButtonClick.bind(this)}
          levelsCount={elementInstances.length}
          lastAsCompletionLevel
          refHolder={progressRefHolder}
        />
        <Presentation
          id={presentationControllingId}
          refHolder={presentationRefHolder}
          slides={elementNodes}
        />
        <ControlPanel
          controlledElementId={presentationControllingId}
          getAlternateFocusable={() => {
            assertIsInstance(tabs, Tabs)
            return tabs.activeTab().content
          }}
          handlePrevButtonClick={this.$handleCPanelBtnClick.bind(this, "prev")}
          handleNextButtonClick={this.$handleCPanelBtnClick.bind(this, "next")}
          handleCTAButtonClick={() => {
            const shouldJumpToResult = resultInstance.isFinalized()
            if (shouldJumpToResult) this.$handleCPanelResultJumpCTAClick()
            else this.$handleCPanelSubmitCTAClick()
          }}
          refHolder={controlPanelRefHolder}
        />
      </section>
    )

    /** @type {Progress} */
    const progress = progressRefHolder.ref
    /** @type {Presentation} */
    const presentation = presentationRefHolder.ref
    /** @type {ControlPanel} */
    const controlPanel = controlPanelRefHolder.ref

    const appropriateIndex = resultInstance.isFinalized() ? resultIndex : 0

    tabs = setupQuizTabs({
      tablistLabel: header,
      elements: fullQuizElements,
      progress,
      presentation,
      defaultTabIndex: appropriateIndex,
      tabChangeHandler: this.$handleTabChange.bind(this)
    })

    revalidateQuiz({
      slideIndex: appropriateIndex,
      elementInstances,
      controlPanel,
      presentation,
      tabs,
      progress
    })

    // Start of property setting
    this.$metadata = { autoSave: autoSaveIsEnabled, storageKey }
    this.$elementInstances = elementInstances

    this.$tabs = tabs
    this.$progress = progress
    this.$presentation = presentation
    this.$controlPanel = controlPanel

    return quizNode
  }

  /** @param {number} slideIndex */
  $revalidate(slideIndex) {
    const {
      $elementInstances,
      $controlPanel,
      $presentation,
      $progress,
      $tabs
    } = this

    revalidateQuiz({
      slideIndex,
      elementInstances: $elementInstances,
      tabs: $tabs,
      controlPanel: $controlPanel,
      presentation: $presentation,
      progress: $progress
    })
  }
}
