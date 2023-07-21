import Component, { createElementRefHolder } from "../core/component"
import { phraseToNode } from "../core/content-parser"
import { uniqueId } from "../core/library"
import Styles from "../scss/question.module.scss"
import ScrollShadow from "./scroll-shadow"

const LETTERS_FOR_ANSWER_CHOICES = ["A", "B", "C", "D"]

const CORRECT_OPTION_CLASS = Styles.Option_correct
const INCORRECT_OPTION_CLASS = Styles.Option_incorrect

const ENABLED_EXPLANATION_CLASS = Styles.Explanation_enabled
const SHOWN_EXPLANATION_CLASS = Styles.Explanation_shown
const QUESTION_METADATA_MAIN_KEY = "selectedOption"

function Option({ handleOptionChange, letter, name, text }) {
  const optionLabellingId = uniqueId()
  return (
    <label className={Styles.Option} htmlFor={optionLabellingId}>
      <input
        checked={false}
        className={Styles.Option__Input}
        id={optionLabellingId}
        name={name}
        onChange={handleOptionChange}
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

function handleExplanationTogglerClick(rootRefHolder) {
  const explanationRoot = rootRefHolder.ref
  explanationRoot.classList.toggle(SHOWN_EXPLANATION_CLASS)
}

function Explanation({ content, rootRefHolder }) {
  if (typeof content !== "string" || content === "") return ""
  return (
    <div className={Styles.Explanation} refHolder={rootRefHolder}>
      <button
        className={Styles.Explanation__Toggler}
        onClick={handleExplanationTogglerClick.bind(null, rootRefHolder)}
        type="button"
      >
        Toggle Explanations
      </button>
      <hr className={Styles.Explanation__Divider} />
      <div className={Styles.Explanation__Content}>{phraseToNode(content)}</div>
    </div>
  )
}

export default class Question extends Component {
  static $styleAnswerInputOption(answerInput, type) {
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

  $setExplanationState(state) {
    if (state === "enabled")
      this.$explanationElement.classList.add(ENABLED_EXPLANATION_CLASS)
    else if (state === "disabled")
      this.$explanationElement.classList.remove(ENABLED_EXPLANATION_CLASS)
  }

  $setAnswerSelectionState(state) {
    if (state === "enabled") this.$fieldSet.disabled = false
    else if (state === "disabled") this.$fieldSet.disabled = true
  }

  $render() {
    const { answer, explanation, handleOptionChange, options, title } =
      this.$props
    const answerOptions = []
    const groupingName = uniqueId()

    this.$answerInputs = null
    this.$correctAnswerInput = null
    this.$explanationElement = null
    this.$fieldSet = null

    const fieldSetRefHolder = createElementRefHolder()
    const explanationRefHolder = createElementRefHolder()
    const questionNodeRefHolder = createElementRefHolder()

    for (let i = 0; i < options.length; i += 1) {
      answerOptions.push(
        <Option
          handleOptionChange={handleOptionChange}
          letter={LETTERS_FOR_ANSWER_CHOICES[i]}
          name={groupingName}
          text={options[i]}
        />
      )
    }

    const questionNode = (
      <div className={Styles.QuestionContainer}>
        <ScrollShadow
          observerConfig={{
            attributes: true,
            attributeFilter: ["class"],
            subtree: true
          }}
        >
          <div className={Styles.Question} refHolder={questionNodeRefHolder}>
            <fieldset refHolder={fieldSetRefHolder}>
              <QuestionBox title={title} answerOptions={answerOptions} />
            </fieldset>
            <Explanation
              content={explanation}
              rootRefHolder={explanationRefHolder}
            />
          </div>
        </ScrollShadow>
      </div>
    )

    this.$explanationElement = explanationRefHolder.ref
    this.$fieldSet = fieldSetRefHolder.ref
    this.$answerInputs = Array.from(
      fieldSetRefHolder.ref.getElementsByTagName("input")
    )
    this.$correctAnswerInput = this.$answerInputs.find(
      (input) => input.value === answer
    )
    return questionNode
  }

  correctAnswerIsPicked() {
    const { $answerInputs, $correctAnswerInput } = this
    const selectedAnswerInput = $answerInputs.find((input) => input.checked)
    return selectedAnswerInput === $correctAnswerInput
  }

  doReset() {
    const { $answerInputs, $correctAnswerInput } = this
    const selectedAnswerInput = $answerInputs.find((input) => input.checked)
    if (selectedAnswerInput !== undefined) {
      selectedAnswerInput.checked = false
      Question.$styleAnswerInputOption(selectedAnswerInput, "reset")
    }

    Question.$styleAnswerInputOption($correctAnswerInput, "reset")
    this.$setExplanationState("disabled")
    this.$setAnswerSelectionState("enabled")
  }

  exportInteractionMetadata() {
    const { $answerInputs } = this
    const selectedAnswerInput = $answerInputs.find((input) => input.checked)
    return {
      [QUESTION_METADATA_MAIN_KEY]: selectedAnswerInput.value
    }
  }

  finalize(metadata) {
    const { $answerInputs, $correctAnswerInput } = this
    let selectedAnswerInput = null

    if (metadata === undefined) {
      selectedAnswerInput = $answerInputs.find((input) => input.checked)
      if (selectedAnswerInput === undefined)
        throw new Error("No answer is selected")
    } else {
      if (typeof metadata !== "object")
        throw new TypeError("metadata must be an object if present")

      const selectedOption = metadata[QUESTION_METADATA_MAIN_KEY]

      const indexOfSelectedOptionLetter =
        LETTERS_FOR_ANSWER_CHOICES.indexOf(selectedOption)
      const inputWithLetterIsAbsent =
        indexOfSelectedOptionLetter > $answerInputs.length - 1

      if (indexOfSelectedOptionLetter < 0 || inputWithLetterIsAbsent)
        throw new Error("Invalid question metadata")

      selectedAnswerInput = $answerInputs.find(
        (input) => input.value === selectedOption
      )

      selectedAnswerInput.checked = true
    }

    if (selectedAnswerInput !== $correctAnswerInput)
      Question.$styleAnswerInputOption(selectedAnswerInput, "incorrect")
    Question.$styleAnswerInputOption($correctAnswerInput, "correct")

    this.$setExplanationState("enabled")
    this.$setAnswerSelectionState("disabled")
  }

  isAnswered() {
    const { $answerInputs } = this
    return $answerInputs.some((input) => input.checked)
  }
}
