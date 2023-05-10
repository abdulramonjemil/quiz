/* eslint-disable react/jsx-props-no-spreading */
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

    const { title, language, content } = props

    if (!isFilledString(title))
      throw new TypeError("code board title must be a non-empty string")
    if (!isFilledString(language))
      throw new TypeError("code board language must be a non-empty string")
    if (!isFilledString(content))
      throw new TypeError("code board content must be a non-empty string")

    const attachedPropsObject = QUIZ_PROPS_MAP.get(this)
    attachedPropsObject.elements.push({
      type: QUIZ_ELEMENT_TYPES.CODE_BOARD,
      props: {
        content,
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

    const { title, options, answer, feedBackContent } = props

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

    if (feedBackContent !== undefined && !isFilledString(feedBackContent))
      throw new TypeError(
        "feedback content must be a non-empty string if present"
      )

    const attachedPropsObject = QUIZ_PROPS_MAP.get(this)
    attachedPropsObject.elements.push({
      type: QUIZ_ELEMENT_TYPES.QUESTION,
      props: {
        answer,
        feedBackContent,
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

  $handleNextButtonClick() {
    const { $controlPanel, $elements, $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return
    const currentSlideIndex = $presentation.currentSlideIndex()
    const indexOfNextElement = currentSlideIndex + 1
    const nextElement = $elements[indexOfNextElement]

    const nextElementIsQuestion = nextElement instanceof Question
    const nextElementIsAnsweredQuestion =
      nextElementIsQuestion && nextElement.isAnswered()
    const nextElementIsLast = indexOfNextElement === $elements.length - 1

    if (
      nextElementIsQuestion &&
      nextElementIsAnsweredQuestion &&
      nextElementIsLast
    ) {
      $controlPanel.enable("submit")
    }

    if (
      (nextElementIsQuestion && !nextElementIsAnsweredQuestion) ||
      nextElementIsLast
    ) {
      $controlPanel.disable("next")
    }

    $controlPanel.enable("prev")
    if (!(nextElement instanceof Result)) $progress.increment()
    $presentation.slideForward()
  }

  $handlePrevButtonClick() {
    const { $controlPanel, $elements, $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return
    const currentSlideIndex = $presentation.currentSlideIndex()
    const indexOfPreviousElement = currentSlideIndex - 1

    if (indexOfPreviousElement === 0) $controlPanel.disable("prev")
    $controlPanel.disable("submit")
    $controlPanel.enable("next")
    if (!($elements[currentSlideIndex] instanceof Result)) $progress.decrement()
    $presentation.slideBackward()
  }

  $handleQuestionOptionChange(questionIndex) {
    const { $controlPanel, $elements, $presentation } = this
    const currentSlideIndex = $presentation.currentSlideIndex()
    const questionAtIndex = $elements[questionIndex]

    if (questionIndex !== currentSlideIndex) return
    if (!questionAtIndex.isAnswered()) {
      $controlPanel.disable("next")
      $controlPanel.disable("submit")
    } else if (currentSlideIndex === $elements.length - 1) {
      $controlPanel.disable("next")
      $controlPanel.enable("submit")
    } else $controlPanel.enable("next")
  }

  async $handleSubmitButtonClick() {
    const {
      $controlPanel,
      $elements,
      $metadata,
      $presentation,
      $startQuestionsReview,
      $submissionCallback
    } = this

    const questionElements = $elements.filter(
      (element) => element instanceof Question
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
        handleExplanationsReview={$startQuestionsReview.bind(this)}
        questionsCount={questionElements.length}
        refHolder={resultRefHolder}
      />
    )

    $controlPanel.disable("prev")
    $controlPanel.disable("submit")
    $presentation.appendSlide(resultNode)
    $elements.push(resultRefHolder.ref)

    await $presentation.slideForward()
    questionElements.forEach((questionElement) => questionElement.finalize())
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
      },
      $handleQuestionOptionChange
    } = this

    const {
      QUESTION: QUESTION_QUIZ_ELEMENT_TYPE,
      CODE_BOARD: CODE_BOARD_QUIZ_ELEMENT_TYPE
    } = QUIZ_ELEMENT_TYPES

    // Storage key is used by some methods called below
    this.$metadata = { autoSave, storageKey, isGlobal }
    this.$elements = []
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

    elements.forEach((element, index) => {
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
            handleOptionChange={$handleQuestionOptionChange.bind(this, index)}
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

    const {
      $handleNextButtonClick,
      $handlePrevButtonClick,
      $handleSubmitButtonClick
    } = this

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
          handlePrevButtonClick={$handlePrevButtonClick.bind(this)}
          handleNextButtonClick={$handleNextButtonClick.bind(this)}
          handleSubmitButtonClick={$handleSubmitButtonClick.bind(this)}
          refHolder={controlPanelRefHolder}
        />
      </section>
    )

    if (resultIsPropagated || elementRefs[0] instanceof Question)
      controlPanelRefHolder.ref.disable("next")
    controlPanelRefHolder.ref.disable("prev")
    controlPanelRefHolder.ref.disable("submit")

    this.$elements = elementRefs
    this.$progress = progressRefHolder.ref
    this.$presentation = presentationRefHolder.ref
    this.$controlPanel = controlPanelRefHolder.ref

    return quizNode
  }

  $retrieveSavedQuizData() {
    if (!webStorageIsAvailable("localStorage")) return null
    const storageKeyToUse = this.$getFullStorageKey()
    return window.localStorage.getItem(storageKeyToUse)
  }

  $populateQuizMetadata(saveToStorage) {
    if (!webStorageIsAvailable("localStorage")) return null
    const { $elements } = this
    const questionElements = $elements.filter(
      (element) => element instanceof Question
    )

    const metadataSet = questionElements.map((questionElement) =>
      questionElement.exportInteractionMetadata()
    )

    const storageKeyToUse = this.$getFullStorageKey()
    const metadataToSave = JSON.stringify({
      [KEYS_FOR_SAVED_QUIZ_METADATA.QUESTION_METADATA_SET]: metadataSet,
      [KEYS_FOR_SAVED_QUIZ_METADATA.ELEMENTS_COUNT]:
        $elements[$elements.length - 1] instanceof Result
          ? $elements.length - 1
          : $elements.length
    })

    if (saveToStorage)
      window.localStorage.setItem(storageKeyToUse, metadataToSave)
    return metadataToSave
  }

  $startQuestionsReview() {
    const { $controlPanel, $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return

    $presentation.restart()
    $progress.restart()
    $controlPanel.disable("prev")
    $controlPanel.enable("next")
  }
}
