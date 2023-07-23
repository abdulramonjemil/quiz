/* eslint-disable max-classes-per-file */

import Component, { createInstanceRefHolder } from "../core/component"
import Styles from "../scss/quiz.module.scss"

/* Must be imported after importing styles above to allow overrides */
import Header from "./header"
import Progress from "./progress"
import Presentation from "./presentation"
import Question from "./question"
import CodeBoard from "./code-board"
import Result from "./result"
import ControlPanel from "./control-panel"

import {
  isFilledString,
  uniqueId,
  webStorageIsAvailable
} from "../core/library"

/**
 * @typedef {import("./control-panel").ControlPanelRevalidationOptions} ControlPanelRevalidationOptions
 * @typedef {import("./question").QuestionMetadata} QuestionMetadata
 * @typedef {import("./progress").ProgressRevalidationOptions} ProgressRevalidationOptions
 */

/**
 * @typedef {ReturnType<typeof Quiz.prototype.$getQuizDataForSlide>} SlideQuizData
 */

const DEFAULT_QUIZ_METADATA = {
  AUTO_SAVE: true,
  CUSTOM_SAVED_DATA: null,
  HEADER: "Test your knowledge",
  IS_GLOBAL_VALUE: false,
  STORAGE_KEY: ""
}

const QUIZ_STORAGE_KEY_RANDOMIZER = "yq2TpI58ul6g3sLioISGNPSroqxcqc"
const QUIZ_ELEMENT_TYPES = {
  CODE_BOARD: "CODE_BOARD",
  QUESTION: "QUESTION"
}

/**
 * Internal map used to store quiz props objects to prevent accessing it from
 * the outside
 */
const QUIZ_PROPS_MAP = new Map()

/**
 * @typedef QuizMetadata
 * @property {QuestionMetadata[]} questionMetadataSet
 * @property {number} elementsCount
 */

class QuizProps {
  constructor(metadata, submissionCallback) {
    if (metadata !== undefined && typeof metadata !== "object")
      throw new TypeError("quiz metadata must be an object if present")

    const { autoSave, customSavedData, header, isGlobal, storageKey } =
      metadata || {}

    if (autoSave !== undefined && typeof autoSave !== "boolean")
      throw new TypeError("quiz auto-save option must be boolean")

    if (
      customSavedData !== undefined &&
      (typeof customSavedData !== "string" || !isFilledString(customSavedData))
    ) {
      throw new TypeError("custom saved quiz data must be a non-empty string")
    }

    if (isGlobal !== undefined && typeof isGlobal !== "boolean")
      throw new TypeError("quiz global state must be boolean")

    if (storageKey !== undefined && !isFilledString(storageKey))
      throw new TypeError("storage key must be a non-empty string")

    if (isGlobal === true && storageKey === undefined)
      throw new TypeError("a global quiz must have a non-empty storage key")

    if (header !== undefined && !isFilledString(header))
      throw new TypeError("header must be a non-empty string")

    if (
      submissionCallback !== undefined &&
      typeof submissionCallback !== "function"
    ) {
      throw new TypeError(
        "quiz submission callback must be a function if present"
      )
    }

    QUIZ_PROPS_MAP.set(this, {
      metadata: {
        autoSave:
          autoSave !== undefined ? autoSave : DEFAULT_QUIZ_METADATA.AUTO_SAVE,
        customSavedData:
          customSavedData || DEFAULT_QUIZ_METADATA.CUSTOM_SAVED_DATA,
        header: header || DEFAULT_QUIZ_METADATA.HEADER,
        isGlobal:
          isGlobal !== undefined
            ? isGlobal
            : DEFAULT_QUIZ_METADATA.IS_GLOBAL_VALUE,
        storageKey: storageKey || DEFAULT_QUIZ_METADATA.STORAGE_KEY
      },
      elements: [],
      submissionCallback
    })
  }

  static define(propsDefinition) {
    if (typeof propsDefinition !== "object")
      throw new TypeError("props definition must be an object")

    const { metadata, elements, submissionCallback } = propsDefinition
    const quizProps = new QuizProps(metadata, submissionCallback)
    quizProps.addElements(elements)
    return quizProps
  }

  addCodeBoard(props) {
    if (typeof props !== "object")
      throw new TypeError("code board props must be an object")

    const { title, language, snippet } = props

    if (!isFilledString(title))
      throw new TypeError("code board title must be a non-empty string")
    if (!isFilledString(language))
      throw new TypeError("code board language must be a non-empty string")
    if (!isFilledString(snippet))
      throw new TypeError("code board snippet must be a non-empty string")

    const attachedPropsObject = QUIZ_PROPS_MAP.get(this)
    attachedPropsObject.elements.push({
      type: QUIZ_ELEMENT_TYPES.CODE_BOARD,
      props: {
        snippet,
        language,
        title
      }
    })
  }

  addElements(elements) {
    if (
      !Array.isArray(elements) ||
      elements.some((element) => typeof element !== "object")
    ) {
      throw new TypeError(
        "elements in props definition must be an array of objects"
      )
    }

    elements.forEach((element) => {
      const { type, props } = element
      if (type === QUIZ_ELEMENT_TYPES.CODE_BOARD) this.addCodeBoard(props)
      else if (type === QUIZ_ELEMENT_TYPES.QUESTION) this.addQuestion(props)
      else throw new TypeError(`Unknow quiz element type: ${type}`)
    })
  }

  addQuestion(props) {
    if (typeof props !== "object")
      throw new TypeError("question props must be an object")

    const { title, options, answer, explanation } = props

    if (!isFilledString(title))
      throw new TypeError("question title must be a non-empty string")

    if (!Array.isArray(options) || options.length < 2 || options.length > 4) {
      throw new TypeError("question options must be between two to four items")
    }

    if (!options.every((option) => isFilledString(option)))
      throw new TypeError("Every option must be a non-empty string")

    const possibleAnswerLetters = ["A", "B", "C", "D"].slice(0, options.length)

    if (typeof answer !== "string" || !possibleAnswerLetters.includes(answer))
      throw new TypeError(
        `The question '${title}' has an invalid answer letter: ${answer}`
      )

    if (explanation !== undefined && !isFilledString(explanation))
      throw new TypeError(
        "Explanation content must be a non-empty string if present"
      )

    const attachedPropsObject = QUIZ_PROPS_MAP.get(this)
    attachedPropsObject.elements.push({
      type: QUIZ_ELEMENT_TYPES.QUESTION,
      props: {
        answer,
        explanation,
        options: [...options],
        title
      }
    })
  }
}

export default class Quiz extends Component {
  static get Props() {
    return QuizProps
  }

  static create(quizProps, container) {
    if (!(quizProps instanceof QuizProps))
      throw new TypeError(
        "quiz props passed to 'Quiz.create' must be an instance of 'QuizProps'"
      )

    const containerIsElementInstance = container instanceof Element
    if (container !== undefined && !containerIsElementInstance)
      throw new TypeError(
        "quiz container passed to 'Quiz.create' must be an instance of 'Element' if present"
      )

    const quizPropsToUse = QUIZ_PROPS_MAP.get(quizProps)
    const quizInstanceRefHolder = createInstanceRefHolder()

    // eslint-disable-next-line react/jsx-props-no-spreading
    const quizElement = (
      <Quiz {...quizPropsToUse} refHolder={quizInstanceRefHolder} />
    )
    if (containerIsElementInstance) container.replaceChildren(quizElement)
    return [quizElement, quizInstanceRefHolder.ref]
  }

  $clearQuizStoredData() {
    if (!webStorageIsAvailable("localStorage")) return
    const storageKeyToUse = this.$getFullStorageKey()
    window.localStorage.removeItem(storageKeyToUse)
  }

  $getFullStorageKey() {
    const {
      $metadata: { isGlobal, storageKey }
    } = this

    /**
     * Storage key will be a non-empty string if isGlobal is true. Else, all
     * quizzes that have no storage key and are global will share the same full
     * storage key which will be equal to QUIZ_STORAGE_KEY_RANDOMIZER. This is
     * enforced in QuizProps.
     */
    return (
      QUIZ_STORAGE_KEY_RANDOMIZER +
      (isGlobal ? "" : window.location.pathname) +
      storageKey
    )
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
      slide: { index: slideIndex },
      quiz: {
        indexOfNextQuestion: indexOfNextQuizQuestion,
        isFinalized: quizIsFinalized
      }
    } = slideQuizData

    return {
      activeLevel: slideIndex + 1,
      highestEnabledLevel:
        quizIsFinalized || indexOfNextQuizQuestion === null
          ? null
          : indexOfNextQuizQuestion + 1
    }
  }

  /** @param {number} slideIndex */
  $getQuizDataForSlide(slideIndex) {
    const { $elements } = this

    const slide = $elements[slideIndex]
    const quizIsFinalized = $elements[$elements.length - 1] instanceof Result
    const slideIsFirst = slideIndex === 0
    const slideIsLast = slideIndex === $elements.length - 1
    const slideIsJustBeforeResult =
      quizIsFinalized && slideIndex === $elements.length - 2

    const slideIsQuestion = slide instanceof Question
    const slideIsAnsweredQuestion = slideIsQuestion && slide.isAnswered()

    const indexOfNextQuizQuestion = $elements.findIndex(
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
        ref: slide
      },
      quiz: {
        indexOfNextQuestion:
          indexOfNextQuizQuestion < 0 ? null : indexOfNextQuizQuestion,
        isFinalized: quizIsFinalized
      }
    }
  }

  async $handleCtaButtonClick() {
    const {
      $controlPanel,
      $elements,
      $indices,
      $metadata,
      $presentation,
      $progress,
      $startQuestionsReview,
      $submissionCallback
    } = this

    /** @type {Question[]} */
    const questionElements = $elements.filter(
      (element) => element instanceof Question
    )

    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return
    const buttonShouldToggleResult =
      $elements[$elements.length - 1] instanceof Result

    if (buttonShouldToggleResult) {
      const currentSlideIndex = $presentation.currentSlideIndex()
      const currentSlideIsResult = currentSlideIndex === $elements.length - 1
      const indexOfSlideToShow = currentSlideIsResult
        ? $indices.lastShownBeforeResult
        : $elements.length - 1

      if (!currentSlideIsResult) {
        $indices.lastShownBeforeResult = currentSlideIndex
      }

      $controlPanel.revalidate(
        this.$getControlPanelRevalidationOptions(
          this.$getQuizDataForSlide(indexOfSlideToShow)
        )
      )
      $presentation.showSlide(indexOfSlideToShow)

      return
    }

    const gottenAnswersCount = questionElements.reduce(
      (previousValue, questionElement) =>
        questionElement.correctAnswerIsPicked()
          ? previousValue + 1
          : previousValue,
      0
    )

    const resultRefHolder = createInstanceRefHolder()
    const resultNode = (
      <Result
        answersGotten={gottenAnswersCount}
        handleExplanationsReview={$startQuestionsReview.bind(this)}
        questionsCount={questionElements.length}
        refHolder={resultRefHolder}
      />
    )

    this.$indices.lastShownBeforeResult = $presentation.currentSlideIndex()
    $presentation.appendSlide(resultNode)
    $elements.push(resultRefHolder.ref)

    $controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(
        this.$getQuizDataForSlide($elements.length - 1)
      )
    )
    await $presentation.showSlide($elements.length - 1)

    questionElements.forEach((questionElement) => questionElement.finalize())
    resultRefHolder.ref.renderIndicator()

    const quizMetadata = this.$populateQuizMetadata($metadata.autoSave)
    if (typeof $submissionCallback === "function")
      $submissionCallback.call(this, quizMetadata)
  }

  $populateQuizMetadata(saveToStorage) {
    const { $elements } = this
    const questionElements = $elements.filter(
      (element) => element instanceof Question
    )

    const metadataSet = questionElements.map(
      (questionElement) =>
        /** @type {QuestionMetadata} */ (
          questionElement.exportInteractionMetadata()
        )
    )

    const storageKeyToUse = this.$getFullStorageKey()

    /** @type {QuizMetadata} */
    const metadataToSave = {
      questionMetadataSet: metadataSet,
      elementsCount:
        $elements[$elements.length - 1] instanceof Result
          ? $elements.length - 1
          : $elements.length
    }

    if (saveToStorage && webStorageIsAvailable("localStorage")) {
      window.localStorage.setItem(
        storageKeyToUse,
        JSON.stringify(metadataToSave)
      )
    }

    return metadataToSave
  }

  $render() {
    const {
      $props: {
        elements,
        metadata: { autoSave, customSavedData, header, isGlobal, storageKey },
        submissionCallback
      }
    } = this

    const {
      QUESTION: QUESTION_QUIZ_ELEMENT_TYPE,
      CODE_BOARD: CODE_BOARD_QUIZ_ELEMENT_TYPE
    } = QUIZ_ELEMENT_TYPES

    // Storage key is used by some methods called below
    this.$metadata = { autoSave, storageKey, isGlobal }
    this.$elements = []

    this.$indices = { prev: null, next: null, lastShownBeforeResult: null }
    this.$submissionCallback = submissionCallback

    /** @type {Progress} */
    this.$progress = null
    /** @type {Presentation} */
    this.$presentation = null
    /** @type {ControlPanel} */
    this.$controlPanel = null

    const elementsCount = elements.length
    if (elementsCount < 1 || elementsCount > 10)
      throw new TypeError("There must be between one to ten quiz elements")

    const lastQuizElement = elements[elementsCount - 1]
    if (lastQuizElement.type !== QUESTION_QUIZ_ELEMENT_TYPE)
      throw new TypeError("The last element in a quiz must be a question")

    const slides = []
    const elementRefs = []

    elements.forEach((element) => {
      const { type, props } = element
      if (
        type !== QUESTION_QUIZ_ELEMENT_TYPE &&
        type !== CODE_BOARD_QUIZ_ELEMENT_TYPE
      )
        throw new TypeError(`Unsupported quiz element type: '${type}'`)

      if (type === CODE_BOARD_QUIZ_ELEMENT_TYPE) {
        const codeBoardNode = <CodeBoard {...props} />
        slides.push(codeBoardNode)
        elementRefs.push(null)
      } else if (type === QUESTION_QUIZ_ELEMENT_TYPE) {
        const questionRefHolder = createInstanceRefHolder()
        const questionNode = (
          <Question
            {...props}
            handleOptionChange={() => {
              const currentSlideIndex = this.$presentation.currentSlideIndex()
              const currentSlideQuizData =
                this.$getQuizDataForSlide(currentSlideIndex)

              this.$controlPanel.revalidate(
                this.$getControlPanelRevalidationOptions(currentSlideQuizData)
              )

              this.$progress.revalidate(
                this.$getProgressRevalidationOptions(currentSlideQuizData)
              )
            }}
            refHolder={questionRefHolder}
          />
        )

        slides.push(questionNode)
        elementRefs.push(questionRefHolder.ref)
      }
    })

    /**
     * The format for the structure of the string expected to be returned by
     * $retrieveSavedQuizData can be found in the definition of the
     * $populateQuizMetadata function
     */
    const storedQuizData = autoSave
      ? this.$retrieveSavedQuizData()
      : customSavedData || null
    let resultIsPropagated = false

    if (storedQuizData !== null) {
      /** @type {QuizMetadata} */
      const parsedQuizData = JSON.parse(storedQuizData)
      /** @type {Question[]} */
      const questionElements = elementRefs.filter(
        (element) => element instanceof Question
      )

      const { questionMetadataSet, elementsCount: savedElementsCount } =
        parsedQuizData

      if (
        questionMetadataSet.length !== questionElements.length ||
        savedElementsCount !== elementsCount
      ) {
        this.$clearQuizStoredData()
      } else {
        questionElements.forEach((questionElement, index) =>
          questionElement.finalize(questionMetadataSet[index])
        )

        const gottenAnswersCount = questionElements.reduce(
          (previousValue, questionElement) =>
            questionElement.correctAnswerIsPicked()
              ? previousValue + 1
              : previousValue,
          0
        )

        const resultRefHolder = createInstanceRefHolder()
        const resultNode = (
          <Result
            answersGotten={gottenAnswersCount}
            handleExplanationsReview={this.$startQuestionsReview.bind(this)}
            questionsCount={questionElements.length}
            refHolder={resultRefHolder}
          />
        )

        slides.push(resultNode)
        elementRefs.push(resultRefHolder.ref)
        resultIsPropagated = true

        // Render the result after a little delay
        setTimeout(() => resultRefHolder.ref.renderIndicator(), 200)
      }
    }

    const quizLabellingId = uniqueId()
    const presentationControllingId = uniqueId()
    const progressRefHolder = createInstanceRefHolder()
    const presentationRefHolder = createInstanceRefHolder()
    const controlPanelRefHolder = createInstanceRefHolder()

    const { $handleCtaButtonClick } = this

    const quizNode = (
      <section className={Styles.Quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{header}</Header>
        <Progress
          handleLevelButtonClick={
            /** @param {number} levelNumber */
            (levelNumber) => {
              // Levels start from 1 not 0
              const levelSlideQuizData = this.$getQuizDataForSlide(
                levelNumber - 1
              )

              this.$controlPanel.revalidate(
                this.$getControlPanelRevalidationOptions(levelSlideQuizData)
              )

              this.$progress.revalidate(
                this.$getProgressRevalidationOptions(levelSlideQuizData)
              )

              this.$presentation.showSlide(levelNumber - 1)
            }
          }
          levelsCount={elementsCount}
          refHolder={progressRefHolder}
          startLevel={resultIsPropagated ? elementsCount : 1}
        />
        <Presentation
          controllingId={presentationControllingId}
          refHolder={presentationRefHolder}
          slides={slides}
          startingSlideIndex={resultIsPropagated ? slides.length - 1 : 0}
        />
        <ControlPanel
          controllingId={presentationControllingId}
          handlePrevButtonClick={() => {
            const { $controlPanel, $indices, $presentation, $progress } = this
            if (!$presentation.slideIsChangeable() || !$progress.isChangeable())
              return

            const prevIndex = $indices.prev
            const prevIndexQuizData = this.$getQuizDataForSlide(prevIndex)

            $controlPanel.revalidate(
              this.$getControlPanelRevalidationOptions(prevIndexQuizData)
            )

            $progress.revalidate(
              this.$getProgressRevalidationOptions(prevIndexQuizData)
            )
            $presentation.showSlide(prevIndex)
          }}
          handleNextButtonClick={() => {
            const { $controlPanel, $indices, $presentation, $progress } = this
            if (!$presentation.slideIsChangeable() || !$progress.isChangeable())
              return

            const nextIndex = $indices.next
            const nextIndexQuizData = this.$getQuizDataForSlide(nextIndex)

            $controlPanel.revalidate(
              this.$getControlPanelRevalidationOptions(nextIndexQuizData)
            )

            $progress.revalidate(
              this.$getProgressRevalidationOptions(nextIndexQuizData)
            )

            $presentation.showSlide(nextIndex)
          }}
          handleSubmitButtonClick={$handleCtaButtonClick.bind(this)}
          refHolder={controlPanelRefHolder}
        />
      </section>
    )

    this.$elements = elementRefs
    this.$progress = progressRefHolder.ref
    this.$presentation = presentationRefHolder.ref
    this.$controlPanel = controlPanelRefHolder.ref

    // Enable and disable necessary buttons
    setTimeout(() => {
      const appropriateSlideQuizData = this.$getQuizDataForSlide(
        resultIsPropagated ? slides.length - 1 : 0
      )
      this.$controlPanel.revalidate(
        this.$getControlPanelRevalidationOptions(appropriateSlideQuizData)
      )
      this.$progress.revalidate(
        this.$getProgressRevalidationOptions(appropriateSlideQuizData)
      )
    })

    return quizNode
  }

  $retrieveSavedQuizData() {
    if (!webStorageIsAvailable("localStorage")) return null
    const storageKeyToUse = this.$getFullStorageKey()
    return window.localStorage.getItem(storageKeyToUse)
  }

  $startQuestionsReview() {
    const { $controlPanel, $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return

    const quizDataForFirstSlide = this.$getQuizDataForSlide(0)
    $controlPanel.revalidate(
      this.$getControlPanelRevalidationOptions(quizDataForFirstSlide)
    )
    $progress.revalidate(
      this.$getProgressRevalidationOptions(quizDataForFirstSlide)
    )
    $presentation.restart()
  }
}
