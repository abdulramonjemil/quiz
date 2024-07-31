import { uniqueId } from "@/lib/id"
import { webStorageIsAvailable } from "@/lib/storage"
import { attemptElementFocus, cn } from "@/lib/dom"
import { assertIsDefined, assertIsInstance, bind } from "@/lib/value"
import { mrh, rh } from "@/core/base"
import { Tabs } from "@/ui/tabs"

import Component from "@/core/component"
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
 * @typedef {import("./header").HeaderLevel} HeaderLevel
 * @typedef {import("./question").AnswerSelectionData} QuestionAnswerSelectionData
 * @typedef {import("./progress").ProgressRevalidationOptions} ProgressRevalidationOptions
 * @typedef {import("./question").OptionIndex} QuestionOptionIndex
 * @typedef {import("./question").QuestionProps} QuestionProps
 * @typedef {import("./code-board").CodeBoardProps} CodeBoardProps
 * @typedef {import("./result").ResultProps} ResultProps
 * @typedef {import("@/ui/tabs").TabChangeHandler} TabChangeHandler
 */

/**
 * @typedef {Omit<QuestionProps, "handleOptionChange"> & {
 *   type: "QUESTION"
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
 * @typedef {QuizQuestionElement | QuizCodeBoardElement} QuizInquiryElement
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
 * @typedef {{
 *   codeboardsCount: number,
 *   questionsCount: number,
 *   correctAnswers: number,
 *   incorrectAnswers: number,
 *   percentScored: number,
 *   elementsCount: number,
 *   elements: (FinalizedQuizInquiryElement)[]
 * }} QuizSubmissionCallbackData
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
 *   header: string,
 *   elements: QuizInquiryElement[] | FinalizedQuizInquiryElement[],
 *   finalized: boolean,
 *   onSubmit?: ((data: QuizSubmissionCallbackData) => void) | undefined,
 *   autosave?: {
 *     identifier: string,
 *     saveWithPathname: boolean
 *   } | null | undefined,
 *   customRootClass?: string | null | undefined,
 *   headerLevel?: HeaderLevel | null | undefined,
 *   codeBoardTheme?: CodeBoardProps["theme"]
 * }} QuizProps
 *
 * @typedef {Question | Result | null} QuizElementInstance
 * @typedef {typeof Quiz} QuizClass
 *
 * @typedef {ReturnType<typeof getQuizDataForSlide>} SlideQuizData
 * @typedef {{ prev: number | null, next: number | null }} PrevNextIndices
 */

const QUIZ_DATA_STORE = "localStorage"

/**
 * @param {QuizInquiryElement | FinalizedQuizInquiryElement} element
 * @returns {element is FinalizedQuizInquiryElement}
 */
function isFinalizedQuizInquiryElement(element) {
  if (element.type === "CODE_BOARD") return true
  if (element.type === "QUESTION") {
    const e = /** @type {FinalizedQuizQuestionElement} */ (element)
    return (
      e.selectedOptionIndex >= 0 && e.selectedOptionIndex < e.options.length
    )
  }
  return false
}

/**
 * @param {QuizInquiryElement[]} elements
 */
function assertValidQuizPropsElementConfig(elements) {
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

/**
 * @param {{
 *   elements: QuizSlideElement[],
 *   codeBoardTheme: QuizProps["codeBoardTheme"]
 *   handleQuestionOptionChange: () => void,
 *   handleResultExplanationBtnClick: ResultProps["handleExplanationBtnClick"]
 * }} param0
 */
function buildQuizSlideElements({
  elements,
  codeBoardTheme,
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
          title={element.title}
          language={element.language}
          snippet={element.snippet}
          theme={codeBoardTheme}
        />
      )
      slideInstance = null
    } else if (element.type === "QUESTION") {
      const questionInstanceRH = /** @type {typeof rh<Question>} */ (rh)(null)
      slideNode = (
        <Question
          title={element.title}
          options={element.options}
          answerIndex={element.answerIndex}
          explanation={element.explanation}
          handleOptionChange={handleQuestionOptionChange}
          instanceRefHolder={questionInstanceRH}
        />
      )
      slideInstance = questionInstanceRH.ref
    } else {
      const resultRH = /** @type {typeof rh<Result>} */ (rh)(null)
      const questionsCount = elements.filter(
        (elem) => elem.type === "QUESTION"
      ).length

      slideNode = (
        <Result
          questionsCount={questionsCount}
          handleExplanationBtnClick={handleResultExplanationBtnClick}
          instanceRefHolder={resultRH}
        />
      )
      slideInstance = resultRH.ref
    }

    elementNodes.push(slideNode)
    elementInstances.push(slideInstance)
  })

  return { elementNodes, elementInstances }
}

/** @param {Exclude<QuizProps["autosave"], null | undefined>} props */
function getStorageKey(props) {
  const id = props.identifier
  const pathname = props.saveWithPathname ? window.location.pathname : "*"
  return `Quiz::id=${id}::pname=${pathname}`
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
 * @param {DecodedStoredQuizData} data
 * @param {QuizInquiryElement[]} elements
 */
function storedDataIsValidForQuiz(data, elements) {
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

  const qElementToPositionMap = new Map(
    elements
      .filter((element) => element.type === "QUESTION")
      .map((element, index) => [element, index + 1])
  )

  const codeToPositionMap = new Map(
    elements
      .filter((element) => element.type === "CODE_BOARD")
      .map((element, index) => [element, index + 1])
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
          const i = qElementToPositionMap.get(element) ?? "-"
          triggerAriaLabel = `Question ${i}`
        } else if (element.type === "CODE_BOARD") {
          const i = codeToPositionMap.get(element) ?? "-"
          triggerAriaLabel = `Code Sample ${i}`
        } else if (element.type === "RESULT") {
          triggerAriaLabel = "Result"
        }

        const trigger = progressElements.buttons[index]
        assertIsDefined(trigger, `progress button at index: ${index}`)
        const content = presentationSlides[index]
        assertIsDefined(content, `presentation slide at index: ${index}`)

        return {
          name: elementTabName,
          triggerAriaLabel,
          triggerId,
          contentId,
          refs: {
            trigger,
            content
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
  presentation.revalidate({ shownSlideIndex: slideIndex })
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

const quizClasses = {
  root: cn("quiz", Styles.Quiz)
}

/**
 * @template {QuizProps} [Props=QuizProps]
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
    const instanceRefHolder = /** @type {typeof rh<Quiz>} */ (rh)(null)
    const quizElement = (
      <Quiz {...props} instanceRefHolder={instanceRefHolder} />
    )
    if (containerIsElementInstance) container.replaceChildren(quizElement)
    return [quizElement, instanceRefHolder.ref]
  }

  /** @param {Props} props */
  constructor(props) {
    const {
      autosave,
      customRootClass,
      elements,
      finalized,
      header,
      headerLevel,
      codeBoardTheme
    } = props

    assertValidQuizPropsElementConfig(elements)
    /** @type {QuizSlideElement[]} */
    const fullQuizElements = [...elements, { type: "RESULT" }]
    const p = Quiz.prototype
    const quizRH = /** @type {typeof mrh<Quiz>} */ (mrh)(null)
    const getThis = () => quizRH.ref

    const { elementNodes, elementInstances } = buildQuizSlideElements({
      elements: fullQuizElements,
      codeBoardTheme,
      handleQuestionOptionChange: bind(p.$handleQuestionOptionChange, getThis),
      handleResultExplanationBtnClick: bind(
        p.$handleResultExplanationBtnClick,
        getThis
      )
    })

    const resultIndex = elementInstances.length - 1
    const resultInstance = elementInstances[resultIndex]
    assertIsInstance(resultInstance, Result)

    if (finalized) {
      const e = /** @type {((typeof elements)[number])[]} */ (elements)
      const filtered = e.filter(isFinalizedQuizInquiryElement)
      if (filtered.length !== elements.length) {
        throw new Error("Invalid finalized quiz data.")
      } else {
        elementInstances.forEach((instance, index) => {
          if (!(instance instanceof Question)) return
          const elementData = filtered[index]
          assertIsDefined(elementData, `finalized quiz data at index: ${index}`)
          if (elementData.type !== "QUESTION") return
          instance.finalize(elementData.selectedOptionIndex)
        })

        const { gottenAnswersCount } = getQuizResultData(elementInstances)
        resultInstance.finalize(gottenAnswersCount)
      }
    } else if (autosave) {
      const storageKey = getStorageKey(autosave)
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
            assertIsDefined(
              storedQData,
              `decoded stored quiz element at index ${index}`
            )

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

    const progressRH = /** @type {typeof rh<Progress>} */ (rh)(null)
    const presentationRH = /** @type {typeof rh<Presentation>} */ (rh)(null)
    const cPanelRH = /** @type {typeof rh<ControlPanel>} */ (rh)(null)
    let tabs = /** @type {Tabs | null} */ (null)

    const shortcutHandlers = createQuizShortcutHandlers(() => {
      assertIsInstance(tabs, Tabs)
      return {
        elementInstances,
        controlPanel: cPanelRH.ref,
        presentation: presentationRH.ref,
        progress: progressRH.ref,
        tabs
      }
    })

    const quizNode = (
      <section
        aria-labelledby={quizLabellingId}
        className={cn(customRootClass, quizClasses.root)}
        tabIndex={-1}
        onKeyDownCapture={shortcutHandlers.keydown}
        onKeyUpCapture={shortcutHandlers.keyup}
      >
        <Header labellingId={quizLabellingId} level={headerLevel}>
          {header}
        </Header>
        <Progress
          levelsCount={elementInstances.length}
          lastAsCompletionLevel
          instanceRefHolder={progressRH}
        />
        <Presentation
          id={presentationControllingId}
          instanceRefHolder={presentationRH}
          slides={elementNodes}
        />
        <ControlPanel
          controlledElementId={presentationControllingId}
          getAlternateFocusable={() => {
            assertIsInstance(tabs, Tabs)
            return tabs.activeTab().content
          }}
          handlePrevButtonClick={bind(p.$handleCPanelBtnClick, getThis, "prev")}
          handleNextButtonClick={bind(p.$handleCPanelBtnClick, getThis, "next")}
          handleCTAButtonClick={() => {
            const shouldJumpToResult = resultInstance.isFinalized()
            if (shouldJumpToResult) this.$handleCPanelResultJumpCTAClick()
            else this.$handleCPanelSubmitCTAClick()
          }}
          instanceRefHolder={cPanelRH}
        />
      </section>
    )

    const appropriateIndex = resultInstance.isFinalized() ? resultIndex : 0

    tabs = setupQuizTabs({
      tablistLabel: header,
      elements: fullQuizElements,
      progress: progressRH.ref,
      presentation: presentationRH.ref,
      defaultTabIndex: appropriateIndex,
      tabChangeHandler: bind(p.$handleTabChange, getThis)
    })

    revalidateQuiz({
      slideIndex: appropriateIndex,
      elementInstances,
      progress: progressRH.ref,
      controlPanel: cPanelRH.ref,
      presentation: presentationRH.ref,
      tabs
    })

    super(props, quizNode)

    quizRH.ref = this

    this.$metadata =
      /** @type {{ autoSave: false } | { autoSave: true, storageKey: string }} */ ({
        autoSave: Boolean(autosave),
        ...(!!autosave && { storageKey: getStorageKey(autosave) })
      })
    this.$elementInstances = elementInstances

    this.$tabs = tabs
    this.$progress = progressRH.ref
    this.$presentation = presentationRH.ref
    this.$controlPanel = cPanelRH.ref
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
    const { onSubmit } = this.$props

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

    let questionIndex = -1
    const finalizedElements = this.$props.elements.map((element) => {
      if (element.type === "CODE_BOARD") return element
      questionIndex += 1
      const d = answerSelectionDataset[questionIndex]
      assertIsDefined(d, `answer selection data at index: ${questionIndex}`)
      const { selectedOptionIndex } = d
      return /** @type {FinalizedQuizQuestionElement} */ ({
        ...element,
        selectedOptionIndex
      })
    })

    assertIsDefined($metadata, "quiz metadata attribute")
    if ($metadata.autoSave) {
      storeQuizData(finalizedElements, $metadata.storageKey)
    }

    if (typeof onSubmit === "function") {
      const f = finalizedElements
      const codeboardsCount = f.filter((e) => e.type === "CODE_BOARD").length
      const questionsCount = f.filter((e) => e.type === "QUESTION").length
      const percentScored = Number(
        ((gottenAnswersCount / questionsCount) * 100).toFixed(2)
      )

      /** @type {QuizSubmissionCallbackData} */
      const submissionData = {
        codeboardsCount,
        questionsCount,
        correctAnswers: gottenAnswersCount,
        incorrectAnswers: questionsCount - gottenAnswersCount,
        percentScored,
        elementsCount: finalizedElements.length,
        elements: finalizedElements
      }
      onSubmit.call(this, submissionData)
    }
  }

  $handleCPanelResultJumpCTAClick() {
    const { $elementInstances } = this
    const resultIndexIfPresent = $elementInstances.length - 1
    this.$revalidate(resultIndexIfPresent)
  }

  $handleQuestionOptionChange() {
    const currentSlideIndex = this.$presentation.currentSlideIndex()
    this.$revalidate(currentSlideIndex)
  }

  $handleResultExplanationBtnClick() {
    this.$revalidate(0)
    attemptElementFocus(this.$tabs.activeTab().content)
  }

  /** @type {TabChangeHandler} */
  $handleTabChange(newTabname, _, source) {
    if (source !== "event") return
    this.$revalidate(tabNameToQuizElementIndex(newTabname))
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
