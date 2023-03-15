import Component, { createElementRefHolder } from "../core/component"
import Styles from "../scss/control-panel.module.scss"

export default class ControlPanel extends Component {
  $render() {
    const {
      handlePrevButtonClick,
      handleNextButtonClick,
      handleSubmitButtonClick
    } = this.$props

    this.$prevButton = null
    this.$nextButton = null
    this.$submitButton = null

    const prevButtonRefHolder = createElementRefHolder()
    const nextButtonRefHolder = createElementRefHolder()
    const submitButtonRefHolder = createElementRefHolder()

    const controlPanelHTML = (
      <div className={Styles.ControlPanelContainer}>
        <div className={Styles.ControlPanel}>
          <button
            className={Styles.Prev}
            onClick={handlePrevButtonClick}
            refHolder={prevButtonRefHolder}
            type="button"
          >
            Prev
          </button>
          <button
            className={Styles.Next}
            onClick={handleNextButtonClick}
            refHolder={nextButtonRefHolder}
            type="button"
          >
            Next
          </button>
          <button
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
    this.$submitButton = submitButtonRefHolder.ref
    return controlPanelHTML
  }

  disable(button) {
    if (button === "prev") this.$prevButton.disabled = true
    else if (button === "next") this.$nextButton.disabled = true
    else if (button === "submit") this.$submitButton.disabled = true
  }

  enable(button) {
    if (button === "prev") this.$prevButton.disabled = false
    else if (button === "next") this.$nextButton.disabled = false
    else if (button === "submit") this.$submitButton.disabled = false
  }
}
