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

const KEYS_FOR_SAVED_QUIZ_METADATA = {
  QUESTION_METADATA_SET: "QUESTION_METADATA_SET",
  ELEMENTS_COUNT: "ELEMENTS_COUNT"
}

/**
 * Internal map used to store quiz props objects to prevent accessing it from
 * the outside
 */
const QUIZ_PROPS_MAP = new Map()

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

  async $handleCtaButtonClick() {
    const {
      $elements,
      $indices,
      $metadata,
      $presentation,
      $progress,
      $questionElements,
      $startQuestionsReview,
      $submissionCallback
    } = this

    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return
    const buttonIsResultToggler =
      $elements[$elements.length - 1] instanceof Result

    if (buttonIsResultToggler) {
      const currentSlideIndex = $presentation.currentSlideIndex()
      const currentSlideIsResult =
        $elements[currentSlideIndex] instanceof Result

      if (currentSlideIsResult)
        $presentation.showSlide($indices.lastShownBeforeResult)
      else {
        $indices.lastShownBeforeResult = currentSlideIndex
        $presentation.showSlide($elements.length - 1)
      }

      return
    }

    const gottenAnswersCount = $questionElements.reduce(
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
        questionsCount={$questionElements.length}
        refHolder={resultRefHolder}
      />
    )

    this.$indices.lastShownBeforeResult = $elements.length - 1
    $presentation.appendSlide(resultNode)
    $elements.push(resultRefHolder.ref)

    this.$controlPanel.revalidate($elements.length - 1)
    await $presentation.showSlide($elements.length - 1)

    $questionElements.forEach((questionElement) => questionElement.finalize())
    resultRefHolder.ref.renderIndicator()

    const savedQuizMetadata = this.$populateQuizMetadata($metadata.autoSave)
    if (typeof $submissionCallback === "function")
      $submissionCallback.call(this, savedQuizMetadata)
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
    this.$questionElements = []

    this.$indices = { prev: null, next: null, lastShownBeforeResult: null }
    this.$submissionCallback = submissionCallback

    this.$progress = null
    this.$presentation = null
    this.$controlPanel = null

    const elementsCount = elements.length
    if (elementsCount < 1)
      throw new TypeError("There must be at least one quiz element")

    const lastQuizElement = elements[elementsCount - 1]
    if (lastQuizElement.type !== QUESTION_QUIZ_ELEMENT_TYPE)
      throw new TypeError("The last element in a quiz must be a question")

    const slides = []
    const elementRefs = []
    const questionElementRefs = []

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
              this.$controlPanel.revalidate(currentSlideIndex)
            }}
            refHolder={questionRefHolder}
          />
        )

        slides.push(questionNode)
        elementRefs.push(questionRefHolder.ref)
        questionElementRefs.push(questionRefHolder.ref)
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
      const parsedQuizData = JSON.parse(storedQuizData)
      const questionElements = elementRefs.filter(
        (element) => element instanceof Question
      )

      const {
        [KEYS_FOR_SAVED_QUIZ_METADATA.QUESTION_METADATA_SET]:
          questionMetadataList,
        [KEYS_FOR_SAVED_QUIZ_METADATA.ELEMENTS_COUNT]: savedElementsCount
      } = parsedQuizData

      if (
        questionMetadataList.length !== questionElements.length ||
        savedElementsCount !== elementsCount
      ) {
        this.$clearQuizStoredData()
      } else {
        questionElements.forEach((questionElement, index) =>
          questionElement.finalize(questionMetadataList[index])
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

    const { $handleCtaButtonClick, $resetControlPanelButtons } = this

    const quizNode = (
      <section className={Styles.Quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{header}</Header>
        <Progress
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
          handlePrevButtonClick={async () => {
            const { $indices, $presentation, $progress } = this
            if (!$presentation.slideIsChangeable() || !$progress.isChangeable())
              return

            const prevIndex = $indices.prev
            this.$controlPanel.revalidate(prevIndex)
            $progress.setActiveLevel(prevIndex + 1)
            await $presentation.showSlide(prevIndex)
          }}
          handleNextButtonClick={async () => {
            const { $indices, $presentation, $progress } = this
            if (!$presentation.slideIsChangeable() || !$progress.isChangeable())
              return

            const nextIndex = $indices.next
            this.$controlPanel.revalidate(nextIndex)
            $progress.setActiveLevel(nextIndex + 1)
            await $presentation.showSlide(nextIndex)
          }}
          handleSubmitButtonClick={$handleCtaButtonClick.bind(this)}
          refHolder={controlPanelRefHolder}
          revalidator={$resetControlPanelButtons.bind(this)}
        />
      </section>
    )

    this.$elements = elementRefs
    this.$questionElements = questionElementRefs
    this.$progress = progressRefHolder.ref
    this.$presentation = presentationRefHolder.ref
    this.$controlPanel = controlPanelRefHolder.ref

    // Enable and disable necessary buttons
    this.$controlPanel.revalidate(resultIsPropagated ? slides.length - 1 : 0)

    return quizNode
  }

  $resetControlPanelButtons(currentSlideIndex) {
    const { $elements, $questionElements, $indices } = this

    const currentSlide = $elements[currentSlideIndex]
    const quizIsFinalized = $elements[$elements.length - 1] instanceof Result
    const currentSlideIsFirst = currentSlideIndex === 0
    const currentSlideIsLast = currentSlideIndex === $elements.length - 1
    const currentSlideIsJustBeforeResult =
      quizIsFinalized && currentSlideIndex === $elements.length - 2

    const currentSlideIsQuestion = currentSlide instanceof Question
    const currentSlideIsAnsweredQuestion =
      currentSlideIsQuestion && currentSlide.isAnswered()

    // The prev button config
    if (!currentSlideIsFirst) $indices.prev = currentSlideIndex - 1
    else $indices.prev = null

    // The next button config
    if (currentSlideIsJustBeforeResult) $indices.next = null
    else if (
      !currentSlideIsLast &&
      (quizIsFinalized ||
        !currentSlideIsQuestion ||
        currentSlideIsAnsweredQuestion)
    ) {
      $indices.next = currentSlideIndex + 1
    } else $indices.next = null

    return {
      prev: $indices.prev !== null,
      next: $indices.next !== null,
      cta: {
        isSubmit: !quizIsFinalized,
        isEnabled:
          quizIsFinalized ||
          $questionElements.every((question) => question.isAnswered())
      }
    }
  }

  $retrieveSavedQuizData() {
    if (!webStorageIsAvailable("localStorage")) return null
    const storageKeyToUse = this.$getFullStorageKey()
    return window.localStorage.getItem(storageKeyToUse)
  }

  $populateQuizMetadata(saveToStorage) {
    const { $elements } = this
    const questionElements = $elements.filter(
      (element) => element instanceof Question
    )

    const metadataSet = questionElements.map((questionElement) =>
      questionElement.exportInteractionMetadata()
    )

    const storageKeyToUse = this.$getFullStorageKey()
    const metadataToSave = {
      [KEYS_FOR_SAVED_QUIZ_METADATA.QUESTION_METADATA_SET]: metadataSet,
      [KEYS_FOR_SAVED_QUIZ_METADATA.ELEMENTS_COUNT]:
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

  async $startQuestionsReview() {
    const { $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return

    this.$controlPanel.revalidate(0)
    $progress.restart()
    await $presentation.restart()
  }
}
