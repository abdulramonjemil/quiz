import Component, { createElementRefHolder } from "@/core/component"
import { attemptElementFocus } from "@/lib/dom"
import Styles from "@/scss/control-panel.module.scss"

/**
 * @typedef CTARevalidationResult
 * @property {boolean} isSubmit
 * @property {boolean} isEnabled
 *
 * @typedef ControlPanelRevalidationOptions
 * @property {boolean} prev
 * @property {boolean} next
 * @property {CTARevalidationResult} cta
 */

export default class ControlPanel extends Component {
  $render() {
    const {
      // This is used to get an element to focus when one of the control panel
      // buttons is disabled
      getAlternateFocusable,
      controlledElementId,
      handlePrevButtonClick,
      handleNextButtonClick,
      handleCTAButtonClick
    } = this.$props

    this.$prevButton = null
    this.$nextButton = null
    this.$cta = null

    const prevButtonRefHolder = createElementRefHolder()
    const nextButtonRefHolder = createElementRefHolder()
    const submitButtonRefHolder = createElementRefHolder()

    const controlPanelNode = (
      <div className={Styles.ControlPanelContainer}>
        <div className={Styles.ControlPanel}>
          <button
            aria-controls={controlledElementId}
            className={Styles.Prev}
            onClick={handlePrevButtonClick}
            refHolder={prevButtonRefHolder}
            type="button"
          >
            Prev
          </button>
          <button
            aria-controls={controlledElementId}
            className={Styles.Next}
            onClick={handleNextButtonClick}
            refHolder={nextButtonRefHolder}
            type="button"
          >
            Next
          </button>
          <button
            aria-controls={controlledElementId}
            className={Styles.Submit}
            onClick={handleCTAButtonClick}
            refHolder={submitButtonRefHolder}
            type="button"
          >
            Submit
          </button>
        </div>
      </div>
    )

    /** @type {(button: "prev" | "next" | "cta") => HTMLElement} */
    this.$alternateFocusableGetter = getAlternateFocusable
    /** @type {HTMLButtonElement} */
    this.$prevButton = prevButtonRefHolder.ref
    /** @type {HTMLButtonElement} */
    this.$nextButton = nextButtonRefHolder.ref
    /** @type {HTMLButtonElement} */
    this.$cta = submitButtonRefHolder.ref
    return controlPanelNode
  }

  /** @param {"next" | "prev" | "cta"} button */
  buttonIsEnabled(button) {
    if (button === "prev") return !this.$prevButton.disabled
    if (button === "next") return !this.$nextButton.disabled
    if (button === "cta") return !this.$cta.disabled
    throw new Error(`Unknown control panel button: '${button}'`)
  }

  /** @param {ControlPanelRevalidationOptions} options */
  revalidate(options) {
    const {
      prev: enablePrev,
      next: enableNext,
      cta: { isSubmit: ctaIsSubmit, isEnabled: enableCTA }
    } = options

    const data = /** @type {const} */ ([
      ["prev", this.$prevButton, enablePrev],
      ["next", this.$nextButton, enableNext],
      ["cta", this.$cta, enableCTA]
    ]).find(([, button, buttonWillRemainEnabled]) => {
      const buttonIsActive = button.contains(document.activeElement)
      return buttonIsActive && !buttonWillRemainEnabled
    })

    if (data) {
      attemptElementFocus(this.$alternateFocusableGetter.call(null, data[0]))
    }
    this.$cta.innerText = ctaIsSubmit ? "Submit" : "Jump to Result"

    this.$prevButton.disabled = !enablePrev
    this.$nextButton.disabled = !enableNext
    this.$cta.disabled = !enableCTA
  }

  /** @param {"next" | "prev" | "cta"} button */
  simulateClick(button) {
    let focused = false
    if (button === "prev") {
      focused = attemptElementFocus(this.$prevButton)
      this.$prevButton.click()
    } else if (button === "next") {
      focused = attemptElementFocus(this.$nextButton)
      this.$nextButton.click()
    } else if (button === "cta") {
      focused = attemptElementFocus(this.$cta)
      this.$cta.click()
    } else throw new Error(`Unknown control panel button: '${button}'`)

    return focused
  }
}
