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

const DEFAULT_QUIZ_HEADER = "Test your knowledge"
const QUESTION_ANSWER_REGEX = /^[A-D]$/
const QUESTION_ANSWER_DESC = "one of the letter A - D"

const QUIZ_STORAGE_KEY_RANDOMIZER = "yq2TpI58ul6g3sLioISGNPSroqxcqc"
const QUIZ_ELEMENT_TYPES = {
  CODE_BOARD: "code-board",
  QUESTION: "question"
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
  constructor(header) {
    if (header !== undefined && !isFilledString(header))
      throw new TypeError("header must be a non-empty string")

    QUIZ_PROPS_MAP.set(this, {
      headerContent: header || DEFAULT_QUIZ_HEADER,
      elements: [],
      storageKey: ""
    })
  }

  addCodeBoard({ title, language, content }) {
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

  addQuestion({ title, options, answer, feedBackContent }) {
    if (!isFilledString(title))
      throw new TypeError("code board title must be a non-empty string")
    if (!Array.isArray(options) || options.length !== 4)
      throw new TypeError(
        "question options must be an array of exactly four items"
      )

    if (!options.every((option) => isFilledString(option)))
      throw new TypeError("Every option must be a non-empty string")
    if (typeof answer !== "string" || !QUESTION_ANSWER_REGEX.test(answer))
      throw new TypeError(`question answer must be ${QUESTION_ANSWER_DESC}`)
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

  setHeader(value) {
    if (!isFilledString(value))
      throw new TypeError("header must be a non-empty string")

    const attachedPropsObject = QUIZ_PROPS_MAP.get(this)
    attachedPropsObject.headerContent = value
  }

  setStorageKey(value) {
    if (!isFilledString(value))
      throw new TypeError("storage key must be a non-empty string")

    const attachedPropsObject = QUIZ_PROPS_MAP.get(this)
    attachedPropsObject.storageKey = value
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

    if (!(container instanceof Element))
      throw new TypeError(
        "quiz container passed to 'Quiz.create' must be an instance of 'Element'"
      )

    const quizPropsToUse = QUIZ_PROPS_MAP.get(quizProps)
    // eslint-disable-next-line react/jsx-props-no-spreading
    container.replaceChildren(<Quiz {...quizPropsToUse} />)
  }

  $clearQuizMetadata() {
    if (!webStorageIsAvailable("localStorage")) return
    const storageKeyToUse = this.$getFullStorageKey()
    window.localStorage.removeItem(storageKeyToUse)
  }

  $getFullStorageKey() {
    return `${QUIZ_STORAGE_KEY_RANDOMIZER}${window.location.pathname}${this.$storageKey}`
  }

  $handleNextButtonClick() {
    const { $controlPanel, $elements, $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return
    const currentSlideIndex = $presentation.currentSlideIndex()
    const indexOfNextElement = currentSlideIndex + 1
    const nextElement = $elements[indexOfNextElement]

    if (
      (nextElement instanceof Question && !nextElement.isAnswered()) ||
      indexOfNextElement === $elements.length - 1
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
    const { $controlPanel, $elements, $startQuestionsReview, $presentation } =
      this
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
    this.$saveQuizMetadata()
  }

  $startQuestionsReview() {
    const { $controlPanel, $presentation, $progress } = this
    if (!$presentation.slideIsChangeable() || !$progress.isChangeable()) return

    $presentation.restart()
    $progress.restart()
    $controlPanel.disable("prev")
    $controlPanel.enable("next")
  }

  $render() {
    const {
      $props: { headerContent, elements, storageKey },
      $handleQuestionOptionChange
    } = this

    const {
      QUESTION: QUESTION_QUIZ_ELEMENT_TYPE,
      CODE_BOARD: CODE_BOARD_QUIZ_ELEMENT_TYPE
    } = QUIZ_ELEMENT_TYPES

    // Storage key is used by some methods called below
    this.$storageKey = storageKey
    this.$elements = []
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

    const storedMetadata = this.$retrieveQuizMetadata()
    let resultIsPropagated = false

    if (storedMetadata !== null) {
      const parsedMetadata = JSON.parse(storedMetadata)
      const questionElements = elementRefs.filter(
        (element) => element instanceof Question
      )

      const {
        [KEYS_FOR_SAVED_QUIZ_METADATA.QUESTION_METADATA_SET]: metadataList,
        [KEYS_FOR_SAVED_QUIZ_METADATA.ELEMENTS_COUNT]: savedElementsCount
      } = parsedMetadata

      if (
        metadataList.length !== questionElements.length ||
        savedElementsCount !== elementsCount
      ) {
        this.$clearQuizMetadata()
      } else {
        questionElements.forEach((questionElement, index) =>
          questionElement.finalize(metadataList[index])
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
        <Header labellingId={quizLabellingId}>{headerContent}</Header>
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

  $retrieveQuizMetadata() {
    if (!webStorageIsAvailable("localStorage")) return null
    const storageKeyToUse = this.$getFullStorageKey()
    return window.localStorage.getItem(storageKeyToUse)
  }

  $saveQuizMetadata() {
    if (!webStorageIsAvailable("localStorage")) return
    const { $elements } = this
    const questionElements = $elements.filter(
      (element) => element instanceof Question
    )

    const metadataSet = questionElements.map((questionElement) =>
      questionElement.exportInteractionMetadata()
    )

    const storageKeyToUse = this.$getFullStorageKey()
    window.localStorage.setItem(
      storageKeyToUse,
      JSON.stringify({
        [KEYS_FOR_SAVED_QUIZ_METADATA.QUESTION_METADATA_SET]: metadataSet,
        [KEYS_FOR_SAVED_QUIZ_METADATA.ELEMENTS_COUNT]:
          $elements[$elements.length - 1] instanceof Result
            ? $elements.length - 1
            : $elements.length
      })
    )
  }
}
