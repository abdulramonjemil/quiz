import { Component, rh } from "@/jsx"
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
 *
 * @typedef {(button: "prev" | "next" | "cta") => HTMLElement} GetAlternateFocusable
 * @typedef {{
 *   getAlternateFocusable: GetAlternateFocusable,
 *   controlledElementId: string,
 *   handlePrevButtonClick: (event: MouseEvent) => void,
 *   handleNextButtonClick: (event: MouseEvent) => void,
 *   handleCTAButtonClick: (event: MouseEvent) => void
 * }} ControlPanelProps
 */

/**
 * @template {ControlPanelProps} [Props=ControlPanelProps]
 * @extends {Component<Props>}
 */
export default class ControlPanel extends Component {
  /** @param {Props} props */
  constructor(props) {
    const {
      getAlternateFocusable,
      controlledElementId,
      handlePrevButtonClick,
      handleNextButtonClick,
      handleCTAButtonClick
    } = props

    const prevButtonRH = /** @type {typeof rh<HTMLButtonElement>} */ (rh)(null)
    const nextButtonRH = /** @type {typeof rh<HTMLButtonElement>} */ (rh)(null)
    const ctaButtonRH = /** @type {typeof rh<HTMLButtonElement>} */ (rh)(null)

    const controlPanelNode = (
      <div className={Styles.ControlPanelContainer}>
        <div className={Styles.ControlPanel}>
          <button
            aria-controls={controlledElementId}
            className={Styles.Prev}
            onClick={handlePrevButtonClick}
            refHolder={prevButtonRH}
            type="button"
          >
            Prev
          </button>
          <button
            aria-controls={controlledElementId}
            className={Styles.Next}
            onClick={handleNextButtonClick}
            refHolder={nextButtonRH}
            type="button"
          >
            Next
          </button>
          <button
            aria-controls={controlledElementId}
            className={Styles.Cta}
            onClick={handleCTAButtonClick}
            refHolder={ctaButtonRH}
            type="button"
          >
            Submit
          </button>
        </div>
      </div>
    )

    super(props, controlPanelNode)

    /**
     * @protected
     * @readonly
     * @type {GetAlternateFocusable}
     */
    this.$alternateFocusableGetter = getAlternateFocusable
    /**
     * @protected
     * @readonly
     * @type {HTMLButtonElement}
     */
    this.$prevButton = prevButtonRH.ref
    /**
     * @protected
     * @readonly
     * @type {HTMLButtonElement}
     */
    this.$nextButton = nextButtonRH.ref
    /**
     * @protected
     * @readonly
     * @type {HTMLButtonElement}
     */
    this.$cta = ctaButtonRH.ref
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
