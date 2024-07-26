import Component, { createElementRefHolder } from "../core/component"
import { phraseToNode } from "../core/content-parser"
import { attemptElementFocus } from "../lib/dom"
import { uniqueId } from "../lib/id"
import { assertIsInstance } from "../lib/value"
import Styles from "../scss/question.module.scss"
import ScrollShadow from "./scroll-shadow"

const LETTERS_FOR_ANSWER_CHOICES = ["A", "B", "C", "D"]

const CORRECT_OPTION_CLASS = Styles.Option_correct
const INCORRECT_OPTION_CLASS = Styles.Option_incorrect

const ENABLED_EXPLANATION_CLASS = Styles.Explanation_enabled
const SHOWN_EXPLANATION_CLASS = Styles.Explanation_shown

/**
 * @typedef {"A" | "B" | "C" | "D"} AnswerOption
 * @typedef {{
 *   selectedOption: AnswerOption;
 * }} QuestionMetadata
 *
 * @typedef {{
 *   title: string,
 *   answer: "A" | "B" | "C" | "D",
 *   options: string[],
 *   explanation?: string | undefined,
 *   handleOptionChange: () => void
 * }} QuestionProps
 */

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

function Explanation({ content, rootRefHolder }) {
  if (typeof content !== "string" || content === "") {
    return <div refHolder={rootRefHolder} />
  }

  return (
    <div className={Styles.Explanation} refHolder={rootRefHolder}>
      <button
        className={Styles.Explanation__Toggler}
        onClick={() => {
          rootRefHolder.ref.classList.toggle(SHOWN_EXPLANATION_CLASS)
        }}
        type="button"
      >
        Toggle Explanations
      </button>
      <hr className={Styles.Explanation__Divider} />
      <div className={Styles.Explanation__Content}>{phraseToNode(content)}</div>
    </div>
  )
}

/**
 * @param {HTMLElement} answerInput
 * @param {"correct" | "incorrect" | "reset"} type
 */
function styleAnswerInputOption(answerInput, type) {
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

/** @param {HTMLElement} element */
function getExplanationButton(element) {
  const button = element.querySelector("button")
  assertIsInstance(button, HTMLButtonElement)
  return button
}

/** @param {HTMLElement} element */
function getExplanationState(element) {
  return element.classList.contains(ENABLED_EXPLANATION_CLASS)
    ? "enabled"
    : "disabled"
}

/**
 * @param {HTMLElement} element
 * @param {"enabled" | "disabled"} state
 */
function setExplanationState(element, state) {
  if (state === "enabled") {
    element.classList.add(ENABLED_EXPLANATION_CLASS)
  } else if (state === "disabled") {
    element.classList.remove(ENABLED_EXPLANATION_CLASS)
  }
}

/**
 * @param {HTMLFieldSetElement} fieldSetElement
 */
function getQuestionState(fieldSetElement) {
  return fieldSetElement.disabled ? "disabled" : "enabled"
}

/**
 * @param {HTMLFieldSetElement} fieldSetElement
 * @param {"enabled" | "disabled"} state
 */
function setQuestionState(fieldSetElement, state) {
  const fieldSet = fieldSetElement
  if (state === "enabled") fieldSet.disabled = false
  else if (state === "disabled") fieldSet.disabled = true
}

/**
 * @template {QuestionProps} Props
 * @extends {Component<Props>}
 */
export default class Question extends Component {
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

    /** @type {HTMLElement} */
    this.$explanationElement = explanationRefHolder.ref
    /** @type {HTMLFieldSetElement} */
    this.$fieldSet = fieldSetRefHolder.ref
    /** @type {HTMLInputElement[]} */
    this.$answerInputs = Array.from(
      this.$fieldSet.getElementsByTagName("input")
    )
    /** @type {HTMLInputElement} */
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
    const {
      $answerInputs,
      $explanationElement,
      $correctAnswerInput,
      $fieldSet
    } = this

    const selectedAnswerInput = $answerInputs.find((input) => input.checked)
    if (selectedAnswerInput !== undefined) {
      selectedAnswerInput.checked = false
      styleAnswerInputOption(selectedAnswerInput, "reset")
    }

    styleAnswerInputOption($correctAnswerInput, "reset")
    setExplanationState($explanationElement, "disabled")
    setQuestionState($fieldSet, "enabled")
  }

  /** @returns {QuestionMetadata} */
  exportInteractionMetadata() {
    const { $answerInputs } = this
    const selectedAnswerInput = $answerInputs.find((input) => input.checked)
    return {
      selectedOption: selectedAnswerInput.value
    }
  }

  /** @param {QuestionMetadata=} metadata */
  finalize(metadata) {
    const {
      $answerInputs,
      $explanationElement,
      $correctAnswerInput,
      $fieldSet
    } = this

    let selectedAnswerInput = null
    if (metadata === undefined) {
      selectedAnswerInput = $answerInputs.find((input) => input.checked)
      if (selectedAnswerInput === undefined) {
        throw new Error("No answer is selected")
      }
    } else {
      if (typeof metadata !== "object") {
        throw new TypeError("metadata must be an object if present")
      }

      const { selectedOption } = metadata
      const indexOfSelectedOptionLetter =
        LETTERS_FOR_ANSWER_CHOICES.indexOf(selectedOption)
      const inputWithLetterIsAbsent =
        indexOfSelectedOptionLetter > $answerInputs.length - 1

      if (indexOfSelectedOptionLetter < 0 || inputWithLetterIsAbsent) {
        throw new Error("Invalid question metadata")
      }

      selectedAnswerInput = $answerInputs.find(
        (input) => input.value === selectedOption
      )
      selectedAnswerInput.checked = true
    }

    styleAnswerInputOption($correctAnswerInput, "correct")
    if (selectedAnswerInput !== $correctAnswerInput) {
      styleAnswerInputOption(selectedAnswerInput, "incorrect")
    }

    setExplanationState($explanationElement, "enabled")
    setQuestionState($fieldSet, "disabled")
  }

  isFinalized() {
    const { $fieldSet, $explanationElement } = this
    return (
      getQuestionState($fieldSet) === "disabled" &&
      getExplanationState($explanationElement) === "enabled"
    )
  }

  isAnswered() {
    const { $answerInputs } = this
    return $answerInputs.some((input) => input.checked)
  }

  /** @param {{ type: "option", value: AnswerOption } | { type: "toggle" }} options  */
  simulateClick(options) {
    let focused = false
    if (options.type === "toggle") {
      const toggleButton = getExplanationButton(this.$explanationElement)
      if (!(toggleButton instanceof HTMLElement)) return false

      focused = attemptElementFocus(toggleButton)
      toggleButton.click()
    } else {
      const { $answerInputs } = this
      const answerIndex = LETTERS_FOR_ANSWER_CHOICES.findIndex(
        (letter) => letter.toLowerCase() === options.value.toLowerCase()
      )

      const inputAtIndex = $answerInputs[answerIndex]
      if (answerIndex >= 0 && inputAtIndex instanceof HTMLElement) {
        focused = attemptElementFocus(inputAtIndex)
        inputAtIndex.click()
      }
    }

    return focused
  }
}
