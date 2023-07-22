import Component, { createElementRefHolder } from "../core/component"
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
      controllingId,
      handlePrevButtonClick,
      handleNextButtonClick,
      handleSubmitButtonClick
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

  disable(button) {
    if (button === "prev") this.$prevButton.disabled = true
    else if (button === "next") this.$nextButton.disabled = true
    else if (button === "submit") this.$cta.disabled = true
    else throw new TypeError(`Unsupported button: '${button}'`)
  }

  enable(button) {
    if (button === "prev") this.$prevButton.disabled = false
    else if (button === "next") this.$nextButton.disabled = false
    else if (button === "submit") this.$cta.disabled = false
    else throw new TypeError(`Unsupported button: '${button}'`)
  }

  /** @param {ControlPanelRevalidationOptions} options */
  revalidate(options) {
    const {
      prev: prevIsEnabled,
      next: nextIsEnabled,
      cta: { isSubmit: ctaIsSubmit, isEnabled: ctaIsEnabled }
    } = options

    this.$prevButton.disabled = !prevIsEnabled
    this.$nextButton.disabled = !nextIsEnabled
    this.$cta.disabled = !ctaIsEnabled
    this.$cta.innerText = ctaIsSubmit ? "Submit" : "Toggle Result"
  }
}
