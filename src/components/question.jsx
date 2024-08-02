import { Component, rh } from "@/jsx"
import { contentNode } from "@/core"
import {
  addClasses,
  attemptElementFocus,
  cn,
  hasClasses,
  removeClasses,
  toggleClasses
} from "@/lib/dom"

import { uniqueId } from "@/lib/id"
import { assertIsDefined, assertIsInstance } from "@/lib/value"
import Styles from "@/scss/question.module.scss"
import ScrollShadow from "./scroll-shadow"

/**
 * @template {any} T
 * @typedef {import("@/jsx/").RefHolder<T>} RefHolder
 */

/**
 * @typedef {0 | 1 | 2 | 3 | (number & {})} OptionIndex
 * @typedef {{
 *   selectedOptionIndex: OptionIndex;
 * }} AnswerSelectionData
 *
 * @typedef {{
 *   title: string,
 *   answerIndex: OptionIndex
 *   options: string[],
 *   explanation?: string | undefined,
 *   handleOptionChange: (index: OptionIndex) => void
 * }} QuestionProps
 */

const LETTERS_FOR_ANSWER_CHOICES = ["A", "B", "C", "D"]

const questionClasses = {
  wrapper: cn("quiz-question-wrapper", Styles.QuestionWrapper),
  root: cn("quiz-question", Styles.Question),
  title: cn("quiz-question-title", Styles.Question__Title),
  optionsContainer: cn([
    "quiz-question-options-container",
    Styles.OptionsContainer
  ]),
  optionRoot: {
    base: cn("quiz-question-option", Styles.Option),
    correct: cn("quiz-question-option--correct", Styles.Option_correct),
    incorrect: cn("quiz-question-option--incorrect", Styles.Option_incorrect)
  },
  optionInput: cn("quiz-question-option-input", Styles.Option__Input),
  optionContent: cn("quiz-question-option-content", Styles.Option__Content),
  optionLetter: cn("quiz-question-option-letter", Styles.Option__Letter),
  optionText: cn("quiz-question-option-text", Styles.Option__Text),
  explRoot: {
    base: cn("quiz-question-expl", Styles.Explanation),
    enabled: cn("quiz-question-expl--enabled", Styles.Explanation_enabled),
    shown: cn("quiz-question-expl--shown", Styles.Explanation_shown)
  },
  explButton: cn("quiz-question-expl-button", Styles.Explanation__Button),
  explDivider: cn("quiz-question-expl-divider", Styles.Explanation__Divider),
  explContent: cn("quiz-question-expl-content", Styles.Explanation__Content)
}

/**
 * @param {number} index
 * @param {HTMLInputElement[]} optionInputs
 */
function assertValidOptionIndex(index, optionInputs) {
  if (index > optionInputs.length - 1) {
    throw new Error(`There is no option at index: ${index}`)
  }
}

/** @param {HTMLInputElement[]} optionInputs */
function getSelectedOptionIndex(optionInputs) {
  const index = optionInputs.findIndex((input) => input.checked)
  return index >= 0 ? index : null
}

/** @param {HTMLInputElement[]} optionInputs */
function getSelectedOptionInput(optionInputs) {
  return optionInputs.find((input) => input.checked) ?? null
}

/**
 * @param {HTMLInputElement} optionInput
 * @param {"selected" | "deselected"} state
 */
function setOptionSelectionState(optionInput, state) {
  const input = optionInput
  if (state === "selected") input.checked = true
  else input.checked = false
}

/**
 * @param {HTMLInputElement} optionInput
 * @param {"correct" | "incorrect" | "reset"} type
 */
function styleOption(optionInput, type) {
  const optionInputLabel = optionInput.closest("label")
  assertIsDefined(optionInputLabel, "option input <label>")
  if (type === "correct") {
    removeClasses(optionInputLabel, questionClasses.optionRoot.incorrect)
    addClasses(optionInputLabel, questionClasses.optionRoot.correct)
  } else if (type === "incorrect") {
    removeClasses(optionInputLabel, questionClasses.optionRoot.correct)
    addClasses(optionInputLabel, questionClasses.optionRoot.incorrect)
  } else if (type === "reset") {
    removeClasses(optionInputLabel, questionClasses.optionRoot.correct)
    removeClasses(optionInputLabel, questionClasses.optionRoot.incorrect)
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
  return hasClasses(element, questionClasses.explRoot.enabled)
    ? "enabled"
    : "disabled"
}

/**
 * @param {HTMLElement} element
 * @param {"enabled" | "disabled"} state
 */
function setExplanationState(element, state) {
  if (state === "enabled") {
    addClasses(element, questionClasses.explRoot.enabled)
  } else if (state === "disabled") {
    removeClasses(element, questionClasses.explRoot.enabled)
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
 * @param {Object} param0
 * @param {() => void} param0.handleOptionChange
 * @param {number} param0.index
 * @param {string} param0.name
 * @param {string} param0.text
 */
function Option({ handleOptionChange, index, name, text }) {
  const optionLabellingId = uniqueId()
  const letter = LETTERS_FOR_ANSWER_CHOICES[index]

  return (
    <label
      className={questionClasses.optionRoot.base}
      htmlFor={optionLabellingId}
    >
      <input
        checked={false}
        className={questionClasses.optionInput}
        id={optionLabellingId}
        name={name}
        onChange={handleOptionChange}
        type="radio"
        value={letter}
      />
      <div className={questionClasses.optionContent}>
        <div className={questionClasses.optionLetter}>{letter}</div>
        <div className={questionClasses.optionText}>
          <span>{contentNode(text)}</span>
        </div>
      </div>
    </label>
  )
}

/**
 * @param {Object} param0
 * @param {string} [param0.content]
 */
function Explanation({ content }) {
  if (typeof content !== "string" || content === "") {
    return <div />
  }

  const rootRefHolder = /** @type {typeof rh<HTMLDivElement>} */ (rh)(null)
  return (
    <div className={questionClasses.explRoot.base} refHolder={rootRefHolder}>
      <button
        className={questionClasses.explButton}
        onClick={() => {
          toggleClasses(rootRefHolder.ref, questionClasses.explRoot.shown)
        }}
        type="button"
      >
        Toggle Explanations
      </button>
      <hr className={questionClasses.explDivider} />
      <div className={questionClasses.explContent}>{contentNode(content)}</div>
    </div>
  )
}

/**
 * @template {QuestionProps} [Props=QuestionProps]
 * @extends {Component<Props>}
 */
export default class Question extends Component {
  /** @param {Props} props */
  constructor(props) {
    const { answerIndex, explanation, handleOptionChange, options, title } =
      props

    const fieldSetRH = /** @type {typeof rh<HTMLElement>} */ (rh)(null)
    const explanationRH = /** @type {typeof rh<HTMLElement>} */ (rh)(null)
    const questionRH = /** @type {typeof rh<HTMLElement>} */ (rh)(null)

    const groupingName = uniqueId()
    const optionNodes = options.map((option, index) => (
      <Option
        handleOptionChange={handleOptionChange.bind(null, index)}
        index={index}
        name={groupingName}
        text={option}
      />
    ))

    const questionNode = (
      <div className={questionClasses.wrapper}>
        <ScrollShadow
          observerConfig={{
            attributes: true,
            attributeFilter: ["class"],
            subtree: true
          }}
        >
          <div className={questionClasses.root} refHolder={questionRH}>
            <fieldset refHolder={fieldSetRH}>
              <legend className={questionClasses.title}>
                {contentNode(title)}
              </legend>
              <div className={questionClasses.optionsContainer}>
                {optionNodes}
              </div>
            </fieldset>

            <Explanation content={explanation} nodeRefHolder={explanationRH} />
          </div>
        </ScrollShadow>
      </div>
    )

    super(props, questionNode)

    const fieldSet = /** @type {HTMLFieldSetElement} */ (fieldSetRH.ref)
    const optionInputs = Array.from(fieldSet.getElementsByTagName("input"))

    this.$elements = {
      explanation: explanationRH.ref,
      fieldSet,
      optionInputs,
      answerInput: /** @type {HTMLInputElement} */ (optionInputs[answerIndex])
    }
  }

  correctAnswerIsPicked() {
    const { $elements } = this
    const selectedOptionInput = getSelectedOptionInput($elements.optionInputs)
    return selectedOptionInput === $elements.answerInput
  }

  doReset() {
    const { $elements } = this

    const selectedOptionInput = getSelectedOptionInput($elements.optionInputs)
    if (selectedOptionInput !== null) {
      setOptionSelectionState(selectedOptionInput, "deselected")
      styleOption(selectedOptionInput, "reset")
    }

    styleOption($elements.answerInput, "reset")
    setExplanationState($elements.explanation, "disabled")
    setQuestionState($elements.fieldSet, "enabled")
  }

  /**
   * Returns the answer selection data if the question is answered, and `null`
   * otherwise.
   *
   * @returns {AnswerSelectionData | null}
   */
  getAnswerSelectionData() {
    const index = getSelectedOptionIndex(this.$elements.optionInputs)
    if (index === null) return null
    return { selectedOptionIndex: index }
  }

  /** @param {number | null | undefined} selectedOptionIndex */
  finalize(selectedOptionIndex = null) {
    const { $elements } = this
    /** @type {HTMLInputElement | null} */
    let selectedOptionInput = null

    if (typeof selectedOptionIndex !== "number") {
      selectedOptionInput = getSelectedOptionInput($elements.optionInputs)
      if (!selectedOptionInput) throw new Error("No answer is selected")
    } else {
      assertValidOptionIndex(selectedOptionIndex, $elements.optionInputs)
      selectedOptionInput = /** @type {HTMLInputElement} */ (
        $elements.optionInputs[selectedOptionIndex]
      )
      setOptionSelectionState(selectedOptionInput, "selected")
    }

    assertIsDefined($elements.answerInput, "answer input")
    styleOption($elements.answerInput, "correct")
    if (selectedOptionInput !== $elements.answerInput) {
      styleOption(selectedOptionInput, "incorrect")
    }

    setExplanationState($elements.explanation, "enabled")
    setQuestionState($elements.fieldSet, "disabled")
  }

  isFinalized() {
    const { $elements } = this
    return (
      getQuestionState($elements.fieldSet) === "disabled" &&
      getExplanationState($elements.explanation) === "enabled"
    )
  }

  isAnswered() {
    return getSelectedOptionIndex(this.$elements.optionInputs) !== null
  }

  /** @param {{ type: "option", index: OptionIndex } | { type: "toggle" }} options  */
  simulateClick(options) {
    const { $elements } = this
    let focused = false

    if (options.type === "toggle") {
      const toggleButton = getExplanationButton($elements.explanation)
      if (!(toggleButton instanceof HTMLElement)) return false

      focused = attemptElementFocus(toggleButton)
      toggleButton.click()
    } else {
      const input = $elements.optionInputs[options.index]
      if (options.index >= 0 && input instanceof HTMLElement) {
        focused = attemptElementFocus(input)
        input.click()
      }
    }

    return focused
  }
}
