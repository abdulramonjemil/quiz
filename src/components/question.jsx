import Component, { createElementRefHolder } from "@/core/component"
import { phraseToNode } from "@/core/content-parser"
import { attemptElementFocus } from "@/lib/dom"
import { uniqueId } from "@/lib/id"
import { assertIsInstance } from "@/lib/value"
import Styles from "@/scss/question.module.scss"
import ScrollShadow from "./scroll-shadow"

const LETTERS_FOR_ANSWER_CHOICES = ["A", "B", "C", "D"]

const CORRECT_OPTION_CLASS = Styles.Option_correct
const INCORRECT_OPTION_CLASS = Styles.Option_incorrect

const ENABLED_EXPLANATION_CLASS = Styles.Explanation_enabled
const SHOWN_EXPLANATION_CLASS = Styles.Explanation_shown

/**
 * @typedef {"A" | "B" | "C" | "D"} AnswerOption
 * @typedef {0 | 1 | 2 | 3} OptionIndex
 * @typedef {{
 *   selectedOption: AnswerOption;
 * }} QuestionMetadata
 *
 * @typedef {{
 *   title: string,
 *   answerIndex: OptionIndex
 *   options: string[],
 *   explanation?: string | undefined,
 *   handleOptionChange: (index: OptionIndex) => void
 * }} QuestionProps
 */

function Option({ handleOptionChange, index, name, text }) {
  const optionLabellingId = uniqueId()
  const letter = LETTERS_FOR_ANSWER_CHOICES[index]

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
function styleOptionInput(answerInput, type) {
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
    const { answerIndex, explanation, handleOptionChange, options, title } =
      this.$props

    this.$optionInputs = null
    this.$answerInput = null
    this.$explanationElement = null
    this.$fieldSet = null

    const fieldSetRefHolder = createElementRefHolder()
    const explanationRefHolder = createElementRefHolder()
    const questionNodeRefHolder = createElementRefHolder()

    const groupingName = uniqueId()
    const answerOptions = options.map((option, index) => (
      <Option
        handleOptionChange={handleOptionChange.bind(null, index)}
        index={index}
        name={groupingName}
        text={option}
      />
    ))

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
    this.$optionInputs = Array.from(
      this.$fieldSet.getElementsByTagName("input")
    )
    /** @type {HTMLInputElement} */
    this.$answerInput = this.$optionInputs[answerIndex]

    return questionNode
  }

  correctAnswerIsPicked() {
    const { $optionInputs, $answerInput } = this
    const selectedAnswerInput = $optionInputs.find((input) => input.checked)
    return selectedAnswerInput === $answerInput
  }

  doReset() {
    const { $optionInputs, $explanationElement, $answerInput, $fieldSet } = this

    const selectedAnswerInput = $optionInputs.find((input) => input.checked)
    if (selectedAnswerInput !== undefined) {
      selectedAnswerInput.checked = false
      styleOptionInput(selectedAnswerInput, "reset")
    }

    styleOptionInput($answerInput, "reset")
    setExplanationState($explanationElement, "disabled")
    setQuestionState($fieldSet, "enabled")
  }

  /** @returns {QuestionMetadata} */
  exportInteractionMetadata() {
    const { $optionInputs } = this
    const selectedAnswerInput = $optionInputs.find((input) => input.checked)
    return {
      selectedOption: selectedAnswerInput.value
    }
  }

  /** @param {number | null | undefined} selectedOptionIndex */
  finalize(selectedOptionIndex) {
    const { $optionInputs, $explanationElement, $answerInput, $fieldSet } = this
    /** @type {HTMLInputElement | undefined | null} */
    let selectedAnswerInput = null

    if (typeof selectedOptionIndex !== "number") {
      selectedAnswerInput = $optionInputs.find((input) => input.checked)
      if (!selectedAnswerInput) throw new Error("No answer is selected")
    } else {
      selectedAnswerInput = $optionInputs[selectedOptionIndex]
      if (!selectedAnswerInput) {
        throw new Error("Invalid selected option index")
      }
      selectedAnswerInput.checked = true
    }

    styleOptionInput($answerInput, "correct")
    if (selectedAnswerInput !== $answerInput) {
      styleOptionInput(selectedAnswerInput, "incorrect")
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
    const { $optionInputs } = this
    return $optionInputs.some((input) => input.checked)
  }

  /** @param {{ type: "option", index: OptionIndex } | { type: "toggle" }} options  */
  simulateClick(options) {
    let focused = false
    if (options.type === "toggle") {
      const toggleButton = getExplanationButton(this.$explanationElement)
      if (!(toggleButton instanceof HTMLElement)) return false

      focused = attemptElementFocus(toggleButton)
      toggleButton.click()
    } else {
      const input = this.$optionInputs[options.index]
      if (options.index >= 0 && input instanceof HTMLElement) {
        focused = attemptElementFocus(input)
        input.click()
      }
    }

    return focused
  }
}
