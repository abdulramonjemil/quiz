import Component from "../core/component"
import styles from "../scss/quiz.module.scss"

export default class Quiz extends Component {
  static create() {
    return null
  }

  /** @protected */
  /* eslint-disable-next-line class-methods-use-this */
  $render() {
    return (
      <div className={styles.quiz}>
        I am <code>Quizy</code>
        <br /> Okay?
      </div>
    )
  }
}
