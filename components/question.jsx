import Component, { createElementRefHolder } from "../core/component"
import { phraseToNode } from "../core/content-parser"
import { uniqueId } from "../core/library"
import Styles from "../scss/question.module.scss"

const NUMBER_OF_ANSWER_CHOICES = 4
const LETTERS_FOR_ANSWER_CHOICES = ["A", "B", "C", "D"]

const CORRECT_OPTION_CLASS = Styles.Option_correct
const INCORRECT_OPTION_CLASS = Styles.Option_incorrect

const ENABLED_FEEDBACK_CLASS = Styles.FeedBack_enabled
const SHOWN_FEEDBACK_CLASS = Styles.FeedBack_shown

const CONTENT_OF_TOGGLER_OF_HIDDEN_FEEDBACK = "Show Explanations"
const CONTENT_OF_TOGGLER_OF_SHOWN_FEEDBACK = "Hide Explanations"

function Option({ letter, name, text }) {
  const optionLabellingId = uniqueId()
  return (
    <label className={Styles.Option} htmlFor={optionLabellingId}>
      <input
        checked={false}
        className={Styles.Option__Input}
        id={optionLabellingId}
        name={name}
        type="radio"
        value={letter}
      />
      <div className={Styles.Option__Body}>
        <div className={Styles.Option__Letter}>{letter}</div>
        <div className={Styles.Option__Text}>
          <span>{phraseToNode(text)}</span>
        </div>
      </div>
    </label>
  )
}

function QuestionBox({ title, answerOptions }) {
  return (
    <>
      <legend className={Styles.Question__Title}>{phraseToNode(title)}</legend>
      <div className={Styles.Question__OptionSet}>{answerOptions}</div>
    </>
  )
}

function handleFeedBackTogglerClick(rootRefHolder, event) {
  const feedBackRoot = rootRefHolder.ref
  const toggler = event.target

  if (feedBackRoot.classList.contains(SHOWN_FEEDBACK_CLASS)) {
    feedBackRoot.classList.remove(SHOWN_FEEDBACK_CLASS)
    toggler.innerText = CONTENT_OF_TOGGLER_OF_HIDDEN_FEEDBACK
  } else {
    feedBackRoot.classList.add(SHOWN_FEEDBACK_CLASS)
    toggler.innerText = CONTENT_OF_TOGGLER_OF_SHOWN_FEEDBACK
  }
}

function FeedBack({ content, rootRefHolder }) {
  if (typeof content !== "string" || content === "") return ""
  return (
    <div className={Styles.FeedBack} refHolder={rootRefHolder}>
      <button
        className={Styles.FeedBack__Toggler}
        onClick={handleFeedBackTogglerClick.bind(null, rootRefHolder)}
        type="button"
      >
        {CONTENT_OF_TOGGLER_OF_HIDDEN_FEEDBACK}
      </button>
      <hr className={Styles.FeedBack__Divider} />
      <div className={Styles.FeedBack__Content}>{phraseToNode(content)}</div>
    </div>
  )
}

export default class Question extends Component {
  $setFeedbackState(state) {
    if (state === "enabled")
      this.$feedBackElement.classList.add(ENABLED_FEEDBACK_CLASS)
    else if (state === "disabled")
      this.$feedBackElement.classList.remove(ENABLED_FEEDBACK_CLASS)
  }

  $setAnswerSelectionState(state) {
    if (state === "enabled") this.$fieldSet.disabled = false
    else if (state === "disabled") this.$fieldSet.disabled = true
  }

  /* eslint-disable-next-line class-methods-use-this */
  $styleAnswerInputOption(answerInput, type) {
    const answerInputLabel = answerInput.closest("label")
    if (type === "correct") {
      answerInputLabel.classList.remove(INCORRECT_OPTION_CLASS)
      answerInputLabel.classList.add(CORRECT_OPTION_CLASS)
    } else if (type === "incorrect") {
      answerInputLabel.classList.remove(CORRECT_OPTION_CLASS)
      answerInputLabel.classList.add(INCORRECT_OPTION_CLASS)
    } else if (type === "reset") {
      answerInputLabel.classList.remove(CORRECT_OPTION_CLASS)
      answerInputLabel.classList.remove(INCORRECT_OPTION_CLASS)
    }
  }

  $render() {
    const { answer, feedBackContent, options, title } = this.$props
    const answerOptions = []
    const groupingName = uniqueId()

    this.$answerInputs = null
    this.$correctAnswerInput = null
    this.$feedBackElement = null
    this.$fieldSet = null

    const fieldSetRefHolder = createElementRefHolder()
    const feedBackRefHolder = createElementRefHolder()

    for (let i = 0; i < NUMBER_OF_ANSWER_CHOICES; i += 1) {
      answerOptions.push(
        <Option
          letter={LETTERS_FOR_ANSWER_CHOICES[i]}
          name={groupingName}
          text={options[i]}
        />
      )
    }

    const questionHTML = (
      <>
        <fieldset className={Styles.Question} refHolder={fieldSetRefHolder}>
          <QuestionBox title={title} answerOptions={answerOptions} />
        </fieldset>
        <FeedBack content={feedBackContent} rootRefHolder={feedBackRefHolder} />
      </>
    )

    this.$feedBackElement = feedBackRefHolder.ref
    this.$fieldSet = fieldSetRefHolder.ref
    this.$answerInputs = Array.from(
      fieldSetRefHolder.ref.getElementsByTagName("input")
    )
    this.$correctAnswerInput = this.$answerInputs.find(
      (input) => input.value === answer
    )
    return questionHTML
  }

  isAnswered() {
    const { $answerInputs } = this
    return $answerInputs.some((input) => input.checked)
  }

  doReset() {
    const { $answerInputs, $correctAnswerInput } = this
    const selectedAnswerInput = $answerInputs.find((input) => input.checked)
    if (selectedAnswerInput !== undefined) {
      selectedAnswerInput.checked = false
      this.$styleAnswerInputOption(selectedAnswerInput, "reset")
    }

    this.$styleAnswerInputOption($correctAnswerInput, "reset")
    this.$setFeedbackState("disabled")
    this.$setAnswerSelectionState("enabled")
  }

  finalize() {
    const { $answerInputs, $correctAnswerInput } = this
    const selectedAnswerInput = $answerInputs.find((input) => input.checked)

    if (selectedAnswerInput === undefined)
      throw new Error("No answer is selected")

    if (selectedAnswerInput !== $correctAnswerInput)
      this.$styleAnswerInputOption(selectedAnswerInput, "incorrect")
    this.$styleAnswerInputOption($correctAnswerInput, "correct")

    this.$setFeedbackState("enabled")
    this.$setAnswerSelectionState("disabled")
  }
}
