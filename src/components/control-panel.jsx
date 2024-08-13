import { Component, rh } from "@/jsx"
import { attemptElementFocus, cn } from "@/lib/dom"
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

const cpanelClasses = {
  root: cn("quiz-cpanel", Styles.ControlPanel),
  inner: cn("quiz-cpanel-inner", Styles.ControlPanel__Inner),
  prevButton: cn("quiz-cpanel-prev-button", Styles.ControlPanel__Prev),
  nextButton: cn("quiz-cpanel-next-button", Styles.ControlPanel__Next),
  ctaButton: cn("quiz-cpanel-cta-button", Styles.ControlPanel__Cta)
}

/**
 * @template {ControlPanelProps} [Props=ControlPanelProps]
 * @extends {Component<Props>}
 */
export default class ControlPanel extends Component {
  /** @param {Props} props */
  constructor(props) {
    const {
      controlledElementId,
      handlePrevButtonClick,
      handleNextButtonClick,
      handleCTAButtonClick
    } = props

    const prevButtonRH = /** @type {typeof rh<HTMLButtonElement>} */ (rh)(null)
    const nextButtonRH = /** @type {typeof rh<HTMLButtonElement>} */ (rh)(null)
    const ctaButtonRH = /** @type {typeof rh<HTMLButtonElement>} */ (rh)(null)

    const controlPanelNode = (
      <div className={cpanelClasses.root}>
        <div className={cpanelClasses.inner}>
          <button
            aria-controls={controlledElementId}
            className={cpanelClasses.prevButton}
            onClick={handlePrevButtonClick}
            refHolder={prevButtonRH}
            type="button"
          >
            Prev
          </button>
          <button
            aria-controls={controlledElementId}
            className={cpanelClasses.nextButton}
            onClick={handleNextButtonClick}
            refHolder={nextButtonRH}
            type="button"
          >
            Next
          </button>
          <button
            aria-controls={controlledElementId}
            className={cpanelClasses.ctaButton}
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
     * @type {HTMLButtonElement}
     */
    this._prevButton = prevButtonRH.ref
    /**
     * @protected
     * @readonly
     * @type {HTMLButtonElement}
     */
    this._nextButton = nextButtonRH.ref
    /**
     * @protected
     * @readonly
     * @type {HTMLButtonElement}
     */
    this._cta = ctaButtonRH.ref
  }

  /** @param {"next" | "prev" | "cta"} button */
  buttonIsEnabled(button) {
    if (button === "prev") return !this._prevButton.disabled
    if (button === "next") return !this._nextButton.disabled
    if (button === "cta") return !this._cta.disabled
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
      ["prev", this._prevButton, enablePrev],
      ["next", this._nextButton, enableNext],
      ["cta", this._cta, enableCTA]
    ]).find(([, button, buttonWillRemainEnabled]) => {
      const buttonIsActive = button.contains(document.activeElement)
      return buttonIsActive && !buttonWillRemainEnabled
    })

    if (data) {
      attemptElementFocus(this._props.getAlternateFocusable(data[0]))
    }
    this._cta.innerText = ctaIsSubmit ? "Submit" : "Jump to Result"

    this._prevButton.disabled = !enablePrev
    this._nextButton.disabled = !enableNext
    this._cta.disabled = !enableCTA
  }

  /** @param {"next" | "prev" | "cta"} button */
  simulateClick(button) {
    let focused = false
    if (button === "prev") {
      focused = attemptElementFocus(this._prevButton)
      this._prevButton.click()
    } else if (button === "next") {
      focused = attemptElementFocus(this._nextButton)
      this._nextButton.click()
    } else if (button === "cta") {
      focused = attemptElementFocus(this._cta)
      this._cta.click()
    } else throw new Error(`Unknown control panel button: '${button}'`)

    return focused
  }
}
