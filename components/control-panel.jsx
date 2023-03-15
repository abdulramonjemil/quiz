import Component from "../core/component"
import Styles from "../scss/control-panel.module.scss"

export default class ControlPanel extends Component {
  $render() {
    const {
      handlePrevButtonClick,
      handleNextButtonClick,
      handleSubmitButtonClick
    } = this.$props

    return (
      <div className={Styles.ControlPanel}>
        <button
          className={Styles.Prev}
          onClick={handlePrevButtonClick}
          type="button"
        >
          Prev
        </button>
        <button
          className={Styles.Next}
          onClick={handleNextButtonClick}
          type="button"
        >
          Next
        </button>
        <button
          className={Styles.Submit}
          onClick={handleSubmitButtonClick}
          type="button"
        >
          Submit
        </button>
      </div>
    )
  }
}
