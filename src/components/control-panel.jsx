import Component, { createElementRefHolder } from "../core/component"
import { attemptElementFocus, attemptTabbableFocus } from "../lib/focus"
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
      alternateFocusable,

      controllingId,
      handlePrevButtonClick,
      handleNextButtonClick,
      handleSubmitButtonClick
    } = this.$props

    this.$alternateFocusable = alternateFocusable
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
            aria-controls={controllingId}
            className={Styles.Prev}
            onClick={handlePrevButtonClick}
            refHolder={prevButtonRefHolder}
            type="button"
          >
            Prev
          </button>
          <button
            aria-controls={controllingId}
            className={Styles.Next}
            onClick={handleNextButtonClick}
            refHolder={nextButtonRefHolder}
            type="button"
          >
            Next
          </button>
          <button
            aria-controls={controllingId}
            className={Styles.Submit}
            onClick={handleSubmitButtonClick}
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
      ([button, buttonIsEnabled]) =>
        button.contains(document.activeElement) && !buttonIsEnabled
    )

    if (shouldRefocus) attemptElementFocus(this.$alternateFocusable.ref)
    this.$cta.innerText = ctaIsSubmit ? "Submit" : "Toggle Result"

    this.$prevButton.disabled = !enablePrev
    this.$nextButton.disabled = !enableNext
    this.$cta.disabled = !enableCTA
  }

  /** @param {"next" | "prev"} action */
  simulateClick(action) {
    if (action === "prev") {
      attemptTabbableFocus(this.$prevButton)
      this.$prevButton.click()
    } else if (action === "next") {
      attemptTabbableFocus(this.$nextButton)
      this.$nextButton.click()
    } else throw new Error(`Unknown control panel action: '${action}'`)
  }
}
