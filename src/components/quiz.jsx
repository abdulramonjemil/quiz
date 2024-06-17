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

/**
 * @typedef {import("./control-panel").ControlPanelRevalidationOptions} ControlPanelRevalidationOptions
 * @typedef {import("./question").QuestionMetadata} QuestionMetadata
 * @typedef {import("./progress").ProgressRevalidationOptions} ProgressRevalidationOptions
 */

/**
 * @typedef {ReturnType<typeof Quiz.prototype.$getQuizDataForSlide>} SlideQuizData
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

/** @typedef {QuizQuestionElement | QuizCodeBoardElement} QuizElement */

/**
 * @typedef QuizProps
 * @property {QuizElement[]} elements
 * @property {(ExportedQuizData) => void} submissionCallback
 * @property {{
 *   autoSave?: boolean | undefined,
 *   customSavedData?: string | undefined,
 *   header?: string | undefined,
 *   isGlobal?: boolean | undefined,
 *   storageKey?: string | undefined
 * }} [metadata]
 */

const DEFAULT_QUIZ_METADATA = {
  AUTO_SAVE: true,
  CUSTOM_SAVED_DATA: null,
  HEADER: "Test your knowledge",
  IS_GLOBAL: false,
  STORAGE_KEY: ""
}

const QUIZ_DATA_STORE = "localStorage"
const QUIZ_STORAGE_KEY_RANDOMIZER = "yq2TpI58ul6g3sLioISGNPSroqxcqc"
const QUIZ_ELEMENT_TYPES = {
  CODE_BOARD: "CODE_BOARD",
  QUESTION: "QUESTION"
}

/** @param {QuizProps["metadata"]} metadata  */
function normalizeQuizMetadataConfig(metadata) {
  const { AUTO_SAVE, CUSTOM_SAVED_DATA, HEADER, IS_GLOBAL, STORAGE_KEY } =
    DEFAULT_QUIZ_METADATA
  const quizGlobalizationValue = metadata?.isGlobal ?? IS_GLOBAL

  return {
    autoSave: metadata?.autoSave ?? AUTO_SAVE,
    customSavedData: metadata?.customSavedData ?? CUSTOM_SAVED_DATA,
    header: metadata?.header ?? HEADER,
    storageKey:
      QUIZ_STORAGE_KEY_RANDOMIZER +
      (quizGlobalizationValue === true ? "" : window.location.pathname) +
      (metadata?.storageKey ?? STORAGE_KEY)
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

/** @param {string} storageKey */
function getStoredQuizData(storageKey) {
  return webStorageIsAvailable(QUIZ_DATA_STORE)
    ? window.localStorage.getItem(storageKey)
    : null
}

/** @param {string} storageKey */
function removeStoredQuizData(storageKey) {
  if (!webStorageIsAvailable(QUIZ_DATA_STORE)) return
  window.localStorage.removeItem(storageKey)
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
 * @param {unknown} data
 * @param {QuizProps["elements"]} elements
 * @returns {data is ExportedQuizData}
 */
function isValidQuizData(data, elements) {
  if (typeof data !== "object") return false
  const questionElements = elements.filter(
    (element) => element.type === "QUESTION"
  )

  const { questionMetadataSet, elementsCount } =
    /** @type {ExportedQuizData} */ (data)

  return (
    questionMetadataSet.length === questionElements.length &&
    elementsCount === elements.length
  )
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

  /**
   * @param {SlideQuizData} slideQuizData
   * @returns {ControlPanelRevalidationOptions}
   */
  $getControlPanelRevalidationOptions(slideQuizData) {
    const {
      slide: {
        index: slideIndex,
        isAnsweredQuestion: slideIsAnsweredQuestion,
        isFirst: slideIsFirst,
        isJustBeforeResult: slideIsJustBeforeResult,
        isLast: slideIsLast,
        isQuestion: slideIsQuestion
      },
      quiz: {
        isFinalized: quizIsFinalized,
        indexOfNextQuestion: indexOfNextQuizQuestion
      }
    } = slideQuizData

    const { $indices } = this

    // The prev button config
    if (!slideIsFirst && (!quizIsFinalized || !slideIsLast))
      $indices.prev = slideIndex - 1
    else $indices.prev = null

    // The next button config
    if (slideIsJustBeforeResult) $indices.next = null
    else if (
      !slideIsLast &&
      (quizIsFinalized || !slideIsQuestion || slideIsAnsweredQuestion)
    ) {
      $indices.next = slideIndex + 1
    } else $indices.next = null

    return {
      prev: $indices.prev !== null,
      next: $indices.next !== null,
      cta: {
        isSubmit: !quizIsFinalized,
        isEnabled: quizIsFinalized || indexOfNextQuizQuestion === null
      }
    }
  }

  /**
   * @param {SlideQuizData} slideQuizData
   * @returns {ProgressRevalidationOptions}
   */
  // eslint-disable-next-line class-methods-use-this
  $getProgressRevalidationOptions(slideQuizData) {
    const {
      slide: { index: slideIndex, isResult: slideIsResult },
      quiz: {
        indexOfNextQuestion: indexOfNextQuizQuestion,
        isFinalized: quizIsFinalized
      }
    } = slideQuizData

    return {
      activeLevel: slideIsResult ? slideIndex : slideIndex + 1,
      highestEnabledLevel:
        quizIsFinalized || indexOfNextQuizQuestion === null
          ? null
          : indexOfNextQuizQuestion + 1
    }
  }

  /** @param {number} slideIndex */
  $getQuizDataForSlide(slideIndex) {
    const { $elementInstances } = this

    const slide = $elementInstances[slideIndex]
    const quizIsFinalized =
      $elementInstances[$elementInstances.length - 1] instanceof Result
    const slideIsFirst = slideIndex === 0
    const slideIsLast = slideIndex === $elementInstances.length - 1
    const slideIsJustBeforeResult =
      quizIsFinalized && slideIndex === $elementInstances.length - 2
    const slideIsResult = quizIsFinalized && slideIsLast

    const slideIsQuestion = slide instanceof Question
    const slideIsAnsweredQuestion = slideIsQuestion && slide.isAnswered()

    const indexOfNextQuizQuestion = $elementInstances.findIndex(
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

  /** @param {"prev" | "next"} button */
  $handleCPanelBtnClick(button) {
    const { $controlPanel, $indices, $presentation, $progress } = this
    const appropriateIndex = button === "prev" ? $indices.prev : $indices.next
    const quizData = this.$getQuizDataForSlide(appropriateIndex)

    $controlPanel.revalidate(this.$getControlPanelRevalidationOptions(quizData))
    $progress.revalidate(this.$getProgressRevalidationOptions(quizData))
    $presentation.revalidate({ activeSlide: appropriateIndex })
  }

  $handleCPanelSubmitCTAClick() {
    const {
      $elementInstances,
      $metadata,
      $submissionCallback,
      $presentation,
      $controlPanel
    } = this

    const questionInstances = $elementInstances.filter(
      /** @returns {element is Question} */ (element) =>
        element instanceof Question
    )

    const { resultNode, resultInstance } = buildQuizResult(
      questionInstances,
      this.$handleResultExplanationBtnClick.bind(this)
    )

    this.$indices.lastShownBeforeResult = $presentation.currentSlideIndex()

    $presentation.appendSlide(resultNode)
    $elementInstances.push(resultInstance)

    $controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(
        this.$getQuizDataForSlide($elementInstances.length - 1)
      )
    )

    $presentation.revalidate({ activeSlide: $elementInstances.length - 1 })
    questionInstances.forEach((questionElement) => questionElement.finalize())
    resultInstance.renderIndicator()

    const questionMetadataSet = questionInstances.map((questionElement) =>
      questionElement.exportInteractionMetadata()
    )

    /** @type {ExportedQuizData} */
    const quizData = {
      questionMetadataSet,
      elementsCount: $elementInstances.length
    }

    if ($metadata.autoSave) storeQuizData(quizData, $metadata.storageKey)
    if (typeof $submissionCallback === "function") {
      $submissionCallback.call(this, quizData)
    }
  }

  $handleCPanelToggleCTAClick() {
    const { $indices, $elementInstances, $presentation, $controlPanel } = this
    const resultIndexIfPresent = $elementInstances.length - 1

    const currentSlideIndex = $presentation.currentSlideIndex()
    const currentSlideIsResult = currentSlideIndex === resultIndexIfPresent
    const indexOfSlideToShow = currentSlideIsResult
      ? $indices.lastShownBeforeResult
      : resultIndexIfPresent

    if (!currentSlideIsResult) {
      $indices.lastShownBeforeResult = currentSlideIndex
    }

    $controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(
        this.$getQuizDataForSlide(indexOfSlideToShow)
      )
    )

    $presentation.revalidate({ activeSlide: indexOfSlideToShow })
  }

  /** @param {number} levelNumber */
  $handleProgressButtonClick(levelNumber) {
    const { $controlPanel, $presentation, $progress } = this
    const levelSlideQuizData = this.$getQuizDataForSlide(
      levelNumber - 1 // Levels start from 1 not 0
    )

    $controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(levelSlideQuizData)
    )

    $progress.revalidate(
      this.$getProgressRevalidationOptions(levelSlideQuizData)
    )

    $presentation.revalidate({ activeSlide: levelNumber - 1 })
  }

  $handleQuestionOptionChange() {
    const currentSlideIndex = this.$presentation.currentSlideIndex()
    const currentSlideQuizData = this.$getQuizDataForSlide(currentSlideIndex)

    this.$controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(currentSlideQuizData)
    )

    this.$progress.revalidate(
      this.$getProgressRevalidationOptions(currentSlideQuizData)
    )
  }

  $handleResultExplanationBtnClick() {
    const { $controlPanel, $presentation, $progress } = this
    const quizDataForFirstSlide = this.$getQuizDataForSlide(0)

    $controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(quizDataForFirstSlide)
    )
    $progress.revalidate(
      this.$getProgressRevalidationOptions(quizDataForFirstSlide)
    )
    $presentation.restart()
  }

  /** @param {KeyboardEvent} event */
  $handleRootKeyDownCapture(event) {
    const { $presentation, $elementInstances, $shortcutData } = this

    if (["a", "b", "c", "d"].includes(event.key.toLowerCase())) {
      const currentSlideIndex = $presentation.currentSlideIndex()
      const currentElement = $elementInstances[currentSlideIndex]
      if (currentElement instanceof Question) {
        currentElement.simulateOptionClick(event.key.toLowerCase())
      }
      return
    }

    if (["p", "n"].includes(event.key.toLowerCase())) {
      const options = { p: "prev", n: "next" }
      this.$controlPanel.simulateClick(options[event.key.toLowerCase()])
      return
    }

    if (event.key.toLocaleLowerCase() === "t") {
      const currentSlideIndex = this.$presentation.currentSlideIndex()
      const {
        quiz: { isFinalized: quizIsFinalized }
      } = this.$getQuizDataForSlide(currentSlideIndex)

      if (quizIsFinalized) this.$controlPanel.simulateClick("cta")
      return
    }

    /**
     * If the key is a number, we only jump to the slide at the number if
     * there is no other slide that begin with the same number.
     */
    if (/\d/.test(event.key)) {
      const levelsCount = this.$progress.levelsCount()
      if (!$shortcutData.pressedNumber) {
        if (levelsCount < Number(event.key) * 10) {
          this.$progress.simulateClick(Number(event.key))
        } else {
          $shortcutData.pressedNumber = Number(event.key)
        }
      } else {
        $shortcutData.pressedNumberIsUsed = true
        this.$progress.simulateClick(
          $shortcutData.pressedNumber * 10 + Number(event.key)
        )
      }
    }
  }

  /** @param {KeyboardEvent} event */
  $handleRootKeyUpCapture(event) {
    const { $progress, $shortcutData } = this
    const { pressedNumber, pressedNumberIsUsed } = $shortcutData
    if (Number(event.key) !== pressedNumber) return

    if (!pressedNumberIsUsed) {
      $progress.simulateClick($shortcutData.pressedNumber)
    }

    $shortcutData.pressedNumber = null
    $shortcutData.pressedNumberIsUsed = false
  }

  $render() {
    const { elements, submissionCallback } = /** @type {QuizProps} */ (
      this.$props
    )

    const {
      autoSave: autoSaveIsEnabled,
      customSavedData,
      header,
      storageKey
    } = normalizeQuizMetadataConfig(this.$props.metadata)

    assertValidQuizElementConfig(elements)

    const { elementNodes, elementInstances: builtInstances } =
      buildQuizElements(elements, this.$handleQuestionOptionChange.bind(this))

    const elementInstances = /** @type {(Question | Result | null)[]} */ (
      builtInstances
    )

    const availableQuizData =
      customSavedData ??
      (autoSaveIsEnabled ? getStoredQuizData(storageKey) : null)

    if (availableQuizData !== null) {
      const quizDataParseResult = tryJSONParse(availableQuizData)
      const quizDataParseValue = quizDataParseResult.value

      if (
        !quizDataParseResult.success ||
        !isValidQuizData(quizDataParseValue, elements)
      ) {
        const dataWasSuppliedDirectly = typeof customSavedData === "string"
        if (dataWasSuppliedDirectly) {
          throw new Error(`Invalid quiz data supplied:\n\n${customSavedData}`)
        } else {
          // Data was read from storage
          removeStoredQuizData(storageKey)
        }
      } else {
        const questionInstances = elementInstances.filter(
          /** @returns {element is Question} */ (element) =>
            element instanceof Question
        )

        const { questionMetadataSet } = quizDataParseValue
        questionInstances.forEach((instance, index) =>
          instance.finalize(questionMetadataSet[index])
        )

        const { resultNode, resultInstance } = buildQuizResult(
          questionInstances,
          this.$handleResultExplanationBtnClick.bind(this)
        )

        elementNodes.push(resultNode)
        elementInstances.push(resultInstance)
        resultInstance.renderIndicator()
      }
    }

    const quizLabellingId = uniqueId()
    const presentationControllingId = uniqueId()
    const quizRootRefHolder = createElementRefHolder()
    const progressRefHolder = createInstanceRefHolder()
    const presentationRefHolder = createInstanceRefHolder()
    const controlPanelRefHolder = createInstanceRefHolder()

    const resultIsPropagated =
      elementInstances[elementInstances.length - 1] instanceof Result

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
          activeLevel={resultIsPropagated ? elements.length : 1}
        />
        <Presentation
          controllingId={presentationControllingId}
          refHolder={presentationRefHolder}
          slides={elementNodes}
          startingSlideIndex={resultIsPropagated ? elementNodes.length - 1 : 0}
        />
        <ControlPanel
          controllingId={presentationControllingId}
          alternateFocusable={quizRootRefHolder}
          handlePrevButtonClick={this.$handleCPanelBtnClick.bind(this, "prev")}
          handleNextButtonClick={this.$handleCPanelBtnClick.bind(this, "next")}
          handleCTAButtonClick={() => {
            const { $elementInstances } = this
            const resultIndexIfPresent = $elementInstances.length - 1
            const shouldToggleResult =
              $elementInstances[resultIndexIfPresent] instanceof Result

            if (shouldToggleResult) this.$handleCPanelToggleCTAClick()
            else this.$handleCPanelSubmitCTAClick()
          }}
          refHolder={controlPanelRefHolder}
        />
      </section>
    )

    this.$metadata = { autoSave: autoSaveIsEnabled, storageKey }
    this.$elementInstances = elementInstances
    this.$submissionCallback = submissionCallback

    this.$shortcutData = {
      pressedNumber: /** @type {number | null} */ (null),
      pressedNumberIsUsed: false
    }

    this.$indices = {
      prev: null,
      next: null,
      lastShownBeforeResult: resultIsPropagated ? elementNodes.length - 2 : null
    }

    /** @type {Progress} */
    this.$progress = progressRefHolder.ref
    /** @type {Presentation} */
    this.$presentation = presentationRefHolder.ref
    /** @type {ControlPanel} */
    this.$controlPanel = controlPanelRefHolder.ref

    const appropriateSlideQuizData = this.$getQuizDataForSlide(
      resultIsPropagated ? elementNodes.length - 1 : 0
    )

    this.$controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(appropriateSlideQuizData)
    )

    this.$progress.revalidate(
      this.$getProgressRevalidationOptions(appropriateSlideQuizData)
    )

    return quizNode
  }
}
