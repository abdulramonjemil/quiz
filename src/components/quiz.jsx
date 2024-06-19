import Component, {
  createElementRefHolder,
  createInstanceRefHolder
} from "../core/component"
import Styles from "../scss/quiz.module.scss"

/* Must be imported after importing styles above to allow overrides */
import Header from "./header"
import Progress from "./progress"
import Presentation from "./presentation"
import Question from "./question"
import CodeBoard from "./code-board"
import Result from "./result"
import ControlPanel from "./control-panel"

import { uniqueId } from "../lib/id"
import { webStorageIsAvailable } from "../lib/storage"
import { tryJSONParse } from "../lib/parse"
import { attemptElementFocus } from "../lib/focus"

/**
 * @typedef {import("./control-panel").ControlPanelRevalidationOptions} ControlPanelRevalidationOptions
 * @typedef {import("./question").QuestionMetadata} QuestionMetadata
 * @typedef {import("./progress").ProgressRevalidationOptions} ProgressRevalidationOptions
 */

/**
 * @typedef ExportedQuizData
 * @property {QuestionMetadata[]} questionMetadataSet
 * @property {number} elementsCount
 */

/**
 * @typedef QuizQuestionElement
 * @property {"QUESTION"} type
 * @property {{
 *   title: string,
 *   answer: "A" | "B" | "C" | "D",
 *   options: [string, string, ...string[]] & { length: 2 | 3 | 4 },
 *   explanation?: string | undefined
 * }} props
 */

/**
 * @typedef QuizCodeBoardElement
 * @property {"CODE_BOARD"} type
 * @property {{
 *   title: string,
 *   language: string,
 *   snippet: string
 * }} props
 */

/**
 * @typedef {ReturnType<typeof getQuizDataForSlide>} SlideQuizData
 * @typedef {QuizQuestionElement | QuizCodeBoardElement} QuizElement
 * @typedef {Question | Result | null} QuizElementInstance
 *
 * @typedef {{
 *   prev: number | null;
 *   next: number | null;
 * }} PrevNextIndices
 */

/**
 * @typedef QuizProps
 * @property {QuizElement[]} elements
 * @property {(ExportedQuizData) => void} submissionCallback
 * @property {{
 *   autoSave?: boolean | undefined,
 *   storedData?: ExportedQuizData | null | undefined,
 *   header?: string | undefined,
 *   isGlobal?: boolean | undefined,
 *   storageKey?: string | undefined
 * }} [metadata]
 */

const DEFAULT_QUIZ_METADATA = {
  AUTO_SAVE: true,
  STORED_DATA: null,
  HEADER: "Test your knowledge",
  IS_GLOBAL: false,
  STORAGE_KEY: ""
}

const QUIZ_DATA_STORE = "localStorage"
const QUIZ_ELEMENT_TYPES = {
  CODE_BOARD: "CODE_BOARD",
  QUESTION: "QUESTION"
}

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
    storedData: metadata?.storedData ?? STORED_DATA,
    header: metadata?.header ?? HEADER,
    storageKey:
      // eslint-disable-next-line prefer-template
      "QUIZDATA" +
      `@k=>${metadata?.storageKey ?? STORAGE_KEY}` +
      (globalizationValue === true ? "" : `@p=>${window.location.pathname}`)
  }
}

/**
 * @param {QuizProps["elements"]} elements
 */
function assertValidQuizElementConfig(elements) {
  const { QUESTION: QUESTION_QUIZ_ELEMENT_TYPE } = QUIZ_ELEMENT_TYPES
  const elementsCount = elements.length

  if (elementsCount < 2)
    throw new TypeError("There must be at least two quiz elements")

  const lastQuizElement = elements[elementsCount - 1]
  if (lastQuizElement.type !== QUESTION_QUIZ_ELEMENT_TYPE)
    throw new TypeError("The last element in a quiz must be a question")
}

/**
 * @param {QuizProps["elements"]} elements
 * @param {() => void} handleQuestionOptionChange
 */
function buildQuizElements(elements, handleQuestionOptionChange) {
  /** @type {HTMLElement[]} */
  const elementNodes = []
  /** @type {(Question | null)[]} */
  const elementInstances = []

  const {
    QUESTION: QUESTION_QUIZ_ELEMENT_TYPE,
    CODE_BOARD: CODE_BOARD_QUIZ_ELEMENT_TYPE
  } = QUIZ_ELEMENT_TYPES

  elements.forEach((element) => {
    const { type, props } = element
    if (
      type !== QUESTION_QUIZ_ELEMENT_TYPE &&
      type !== CODE_BOARD_QUIZ_ELEMENT_TYPE
    ) {
      throw new TypeError(`Unsupported quiz element type: '${type}'`)
    }

    /** @type {HTMLElement} */
    let slideNode
    /** @type {Question | null} */
    let slideInstance

    if (type === CODE_BOARD_QUIZ_ELEMENT_TYPE) {
      slideNode = <CodeBoard {...props} />
      slideInstance = null
    } else if (type === QUESTION_QUIZ_ELEMENT_TYPE) {
      const questionInstanceRefHolder = createInstanceRefHolder()
      slideNode = (
        <Question
          {...props}
          handleOptionChange={handleQuestionOptionChange}
          refHolder={questionInstanceRefHolder}
        />
      )
      slideInstance = questionInstanceRefHolder.ref
    }

    elementNodes.push(slideNode)
    elementInstances.push(slideInstance)
  })

  return { elementNodes, elementInstances }
}

/**
 * @param {unknown} data
 * @returns {data is ExportedQuizData}
 */
function isValidQuizData(data) {
  if (typeof data !== "object") return false
  const { questionMetadataSet, elementsCount } =
    /** @type {ExportedQuizData} */ (data)
  return Array.isArray(questionMetadataSet) && typeof elementsCount === "number"
}

/** @param {string} storageKey */
function removeStoredQuizData(storageKey) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.removeItem(storageKey)
}

/** @param {string} storageKey */
function getStoredQuizData(storageKey) {
  const data = webStorageIsAvailable(QUIZ_DATA_STORE)
    ? window.localStorage.getItem(storageKey)
    : null

  if (!data) return null

  const parseResult = tryJSONParse(data)
  if (!parseResult.success) {
    removeStoredQuizData(storageKey)
    return null
  }

  const { value } = parseResult
  return isValidQuizData(value) ? value : null
}

/**
 * @param {ExportedQuizData} data
 * @param {QuizProps["elements"]} quizElements
 * @returns {data is ExportedQuizData}
 */
function storedDataIsValidForQuiz(data, quizElements) {
  const { questionMetadataSet, elementsCount } = data
  const questionElements = quizElements.filter(
    (element) => element.type === "QUESTION"
  )

  return (
    questionMetadataSet.length === questionElements.length &&
    elementsCount === quizElements.length
  )
}

/**
 * @param {ExportedQuizData} data
 * @param {string} storageKey
 */
function storeQuizData(data, storageKey) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.setItem(storageKey, JSON.stringify(data))
}

/**
 * @param {Question[]} questionInstances
 * @param {() => void} handleExplanationBtnClick
 */
function buildQuizResult(questionInstances, handleExplanationBtnClick) {
  const gottenAnswersCount = questionInstances.reduce(
    (previousValue, instance) =>
      instance.correctAnswerIsPicked() ? previousValue + 1 : previousValue,
    0
  )

  const resultRefHolder = createInstanceRefHolder()
  const resultNode = (
    <Result
      answersGotten={gottenAnswersCount}
      handleExplanationBtnClick={handleExplanationBtnClick}
      questionsCount={questionInstances.length}
      refHolder={resultRefHolder}
    />
  )

  return {
    resultNode,
    resultInstance: /** @type {Result} */ (resultRefHolder.ref)
  }
}

/**
 * @param {QuizElementInstance[]} elementInstances
 * @param {number} slideIndex
 */
function getQuizDataForSlide(elementInstances, slideIndex) {
  const slide = elementInstances[slideIndex]
  const quizIsFinalized =
    elementInstances[elementInstances.length - 1] instanceof Result
  const slideIsFirst = slideIndex === 0
  const slideIsLast = slideIndex === elementInstances.length - 1
  const slideIsJustBeforeResult =
    quizIsFinalized && slideIndex === elementInstances.length - 2
  const slideIsResult = quizIsFinalized && slideIsLast

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
      isJustBeforeResult: slideIsJustBeforeResult,
      isQuestion: slideIsQuestion,
      isResult: slideIsResult,
      ref: slide
    },
    quiz: {
      indexOfNextQuestion:
        indexOfNextQuizQuestion < 0 ? null : indexOfNextQuizQuestion,
      isFinalized: quizIsFinalized
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
      isFinalized: quizIsFinalized
    }
  } = slideQuizData

  return {
    activeLevelIndex: slideIndex,
    highestEnabledLevelIndex:
      quizIsFinalized || indexOfNextQuizQuestion === null
        ? null
        : indexOfNextQuizQuestion
  }
}

/**
 * @param {SlideQuizData} slideQuizData
 * @returns {PrevNextIndices}
 */
function getSlidePrevNextIndices(slideQuizData) {
  const { index, isFirst, isLast } = slideQuizData.slide
  return {
    prev: isFirst ? null : index - 1,
    next: isLast ? null : index + 1
  }
}

/**
 * @param {Object} param0
 * @param {number} param0.slideIndex
 * @param {QuizElementInstance[]} param0.elementInstances
 * @param {ControlPanel} param0.controlPanel
 * @param {Presentation} param0.presentation
 * @param {Progress} param0.progress
 */
function revalidateQuiz({
  slideIndex,
  elementInstances,
  controlPanel,
  presentation,
  progress
}) {
  const appropriateSlideQuizData = getQuizDataForSlide(
    elementInstances,
    slideIndex
  )

  presentation.revalidate({ activeSlide: slideIndex })
  progress.revalidate(getProgressRevalidationOptions(appropriateSlideQuizData))
  controlPanel.revalidate(
    getControlPanelRevalidationOptions(
      appropriateSlideQuizData,
      getSlidePrevNextIndices(appropriateSlideQuizData)
    )
  )
}

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
    const {
      $elementInstances,
      $metadata,
      $submissionCallback,
      $progress,
      $presentation
    } = this

    const questionInstances = $elementInstances.filter(
      /** @returns {element is Question} */ (element) =>
        element instanceof Question
    )

    const { resultNode, resultInstance } = buildQuizResult(
      questionInstances,
      this.$handleResultExplanationBtnClick.bind(this)
    )

    $presentation.appendSlide(resultNode)
    $progress.addCompletionLevel()
    $elementInstances.push(resultInstance)

    const resultIndex = $elementInstances.length - 1
    this.$revalidate(resultIndex)

    questionInstances.forEach((questionElement) => questionElement.finalize())
    const questionMetadataSet = questionInstances.map((questionElement) =>
      questionElement.exportInteractionMetadata()
    )

    /** @type {ExportedQuizData} */
    const quizData = {
      questionMetadataSet,
      // Subtract 1 to exclude the added result element
      elementsCount: $elementInstances.length - 1
    }

    if ($metadata.autoSave) storeQuizData(quizData, $metadata.storageKey)
    if (typeof $submissionCallback === "function") {
      $submissionCallback.call(this, quizData)
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

  /** @param {KeyboardEvent} event */
  $handleRootKeyDownCapture(event) {
    const { $presentation, $elementInstances, $mutableStore } = this

    // Shortcut to select question answer
    if (["a", "b", "c", "d"].includes(event.key.toLowerCase())) {
      const currentSlideIndex = $presentation.currentSlideIndex()
      const currentElement = $elementInstances[currentSlideIndex]

      if (currentElement instanceof Question) {
        currentElement.simulateClick({
          type: "option",
          value: event.key.toLowerCase()
        })
      }
      return
    }

    // Shortcut to go to next/prev quiz element
    if (["p", "n"].includes(event.key.toLowerCase())) {
      const options = { p: "prev", n: "next" }
      this.$controlPanel.simulateClick(options[event.key.toLowerCase()])
      return
    }

    // Shortcut to show explanation for answered question
    if (event.key.toLowerCase() === "e") {
      const currentSlideIndex = this.$presentation.currentSlideIndex()
      const { isFinalized: quizIsFinalized } = getQuizDataForSlide(
        $elementInstances,
        currentSlideIndex
      ).quiz

      const currentElementInstance = this.$elementInstances[currentSlideIndex]
      const elementIsQuestion = currentElementInstance instanceof Question

      if (quizIsFinalized && elementIsQuestion) {
        currentElementInstance.simulateClick({ type: "toggle" })
      }
    }

    // Shortcut to show result
    if (event.key.toLocaleLowerCase() === "r") {
      const currentSlideIndex = this.$presentation.currentSlideIndex()
      const {
        quiz: { isFinalized: quizIsFinalized }
      } = getQuizDataForSlide($elementInstances, currentSlideIndex)

      if (quizIsFinalized) {
        const resultIndex = $elementInstances.length - 1
        this.$progress.simulateClick(resultIndex)
      }

      return
    }

    /**
     * - Shortcut to jump to specific quiz element based on number
     *
     * If the key is a number, we only jump to the slide at the number if
     * there is no other slide that begin with the same number.
     */
    if (/\d/.test(event.key)) {
      const levelsCount = this.$progress.levelsCount()
      if (!$mutableStore.shortcutData.pressedNumber) {
        if (levelsCount < Number(event.key) * 10) {
          this.$progress.simulateClick(Number(event.key) - 1)
        } else {
          $mutableStore.shortcutData.pressedNumber = Number(event.key)
        }
      } else {
        $mutableStore.shortcutData.pressedNumberIsUsed = true
        this.$progress.simulateClick(
          $mutableStore.shortcutData.pressedNumber * 10 + Number(event.key) - 1
        )
      }
    }
  }

  /** @param {KeyboardEvent} event */
  $handleRootKeyUpCapture(event) {
    const { $progress, $mutableStore } = this
    const { pressedNumber, pressedNumberIsUsed } = $mutableStore.shortcutData
    if (Number(event.key) !== pressedNumber) return

    if (!pressedNumberIsUsed) {
      $progress.simulateClick(pressedNumber - 1)
    }

    $mutableStore.shortcutData.pressedNumber = null
    $mutableStore.shortcutData.pressedNumberIsUsed = false
  }

  $render() {
    const { elements, submissionCallback } = /** @type {QuizProps} */ (
      this.$props
    )

    const {
      autoSave: autoSaveIsEnabled,
      storedData,
      header,
      storageKey
    } = normalizeQuizMetadataConfig(this.$props.metadata)

    assertValidQuizElementConfig(elements)

    const { elementNodes, elementInstances: builtInstances } =
      buildQuizElements(elements, this.$handleQuestionOptionChange.bind(this))

    const elementInstances = /** @type {QuizElementInstance[]} */ (
      builtInstances
    )

    const availableQuizData =
      storedData ?? (autoSaveIsEnabled ? getStoredQuizData(storageKey) : null)

    if (availableQuizData) {
      if (!storedDataIsValidForQuiz(availableQuizData, elements)) {
        const dataWasSuppliedDirectly = storedData !== null
        if (dataWasSuppliedDirectly) {
          throw new Error(`Invalid quiz data supplied:\n\n${storedData}`)
        } else {
          // eslint-disable-next-line no-console
          console.error(`Invalid quiz data read from storage:\n\n${storedData}`)
          // Data was read from storage
          removeStoredQuizData(storageKey)
        }
      } else {
        const questionInstances = elementInstances.filter(
          /** @returns {element is Question} */ (element) =>
            element instanceof Question
        )

        const { questionMetadataSet } = availableQuizData
        questionInstances.forEach((instance, index) =>
          instance.finalize(questionMetadataSet[index])
        )

        const { resultNode, resultInstance } = buildQuizResult(
          questionInstances,
          this.$handleResultExplanationBtnClick.bind(this)
        )

        elementNodes.push(resultNode)
        elementInstances.push(resultInstance)
      }
    }

    const quizLabellingId = uniqueId()
    const presentationControllingId = uniqueId()
    const quizRootRefHolder = createElementRefHolder()
    const progressRefHolder = createInstanceRefHolder()
    const presentationRefHolder = createInstanceRefHolder()
    const controlPanelRefHolder = createInstanceRefHolder()

    const quizNode = (
      <section
        aria-labelledby={quizLabellingId}
        className={Styles.Quiz}
        refHolder={quizRootRefHolder}
        tabIndex={-1}
        onKeyDownCapture={this.$handleRootKeyDownCapture.bind(this)}
        onKeyUpCapture={this.$handleRootKeyUpCapture.bind(this)}
      >
        <Header labellingId={quizLabellingId}>{header}</Header>
        <Progress
          handleLevelButtonClick={this.$handleProgressButtonClick.bind(this)}
          levelsCount={elements.length}
          refHolder={progressRefHolder}
        />
        <Presentation
          controllingId={presentationControllingId}
          refHolder={presentationRefHolder}
          slides={elementNodes}
        />
        <ControlPanel
          controllingId={presentationControllingId}
          altFocusableRefHolder={quizRootRefHolder}
          handlePrevButtonClick={this.$handleCPanelBtnClick.bind(this, "prev")}
          handleNextButtonClick={this.$handleCPanelBtnClick.bind(this, "next")}
          handleCTAButtonClick={() => {
            const { $elementInstances } = this
            const resultIndexIfPresent = $elementInstances.length - 1
            const shouldJumpToResult =
              $elementInstances[resultIndexIfPresent] instanceof Result

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

    const resultIsPropagated =
      elementInstances[elementInstances.length - 1] instanceof Result

    const appropriateIndex = resultIsPropagated ? elementNodes.length - 1 : 0
    if (resultIsPropagated) progress.addCompletionLevel()
    revalidateQuiz({
      slideIndex: appropriateIndex,
      elementInstances,
      controlPanel,
      presentation,
      progress
    })

    // Start of property setting
    this.$metadata = { autoSave: autoSaveIsEnabled, storageKey }
    this.$elementInstances = elementInstances
    this.$submissionCallback = submissionCallback

    this.$mutableStore = {
      shortcutData: {
        pressedNumber: /** @type {number | null} */ (null),
        pressedNumberIsUsed: false
      }
    }

    this.$progress = progress
    this.$presentation = presentation
    this.$controlPanel = controlPanel

    return quizNode
  }

  /** @param {number} slideIndex */
  $revalidate(slideIndex) {
    const { $elementInstances, $controlPanel, $presentation, $progress } = this
    revalidateQuiz({
      slideIndex,
      elementInstances: $elementInstances,
      controlPanel: $controlPanel,
      presentation: $presentation,
      progress: $progress
    })
  }
}
