import Component, { createElementRefHolder } from "../core/component"
import { attemptElementFocus } from "../lib/dom"
import Styles from "../scss/control-panel.module.scss"

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
      // This is focused when the next or prev buttons are disabled
      altFocusableRefHolder,
      controlledElementId,
      handlePrevButtonClick,
      handleNextButtonClick,
      handleCTAButtonClick
    } = this.$props

    this.$altFocusableRefHolder = altFocusableRefHolder
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

    this.$prevButton = prevButtonRefHolder.ref
    this.$nextButton = nextButtonRefHolder.ref
    this.$cta = submitButtonRefHolder.ref
    return controlPanelNode
  }

  /** @param {ControlPanelRevalidationOptions} options */
  revalidate(options) {
    const {
      prev: enablePrev,
      next: enableNext,
      cta: { isSubmit: ctaIsSubmit, isEnabled: enableCTA }
    } = options

    const shouldRefocus = [
      [this.$prevButton, enablePrev],
      [this.$nextButton, enableNext],
      [this.$cta, enableCTA]
    ].some(
      ([button, buttonWillRemainEnabled]) =>
        button.contains(document.activeElement) && !buttonWillRemainEnabled
    )

    if (shouldRefocus) attemptElementFocus(this.$altFocusableRefHolder.ref)
    this.$cta.innerText = ctaIsSubmit ? "Submit" : "Jump to Result"

    this.$prevButton.disabled = !enablePrev
    this.$nextButton.disabled = !enableNext
    this.$cta.disabled = !enableCTA
  }

  /** @param {"next" | "prev" | "cta"} button */
  simulateClick(button) {
    if (button === "prev") {
      attemptElementFocus(this.$prevButton)
      this.$prevButton.click()
    } else if (button === "next") {
      attemptElementFocus(this.$nextButton)
      this.$nextButton.click()
    } else if (button === "cta") {
      attemptElementFocus(this.$cta)
      this.$cta.click()
    } else throw new Error(`Unknown control panel button: '${button}'`)
  }
}
