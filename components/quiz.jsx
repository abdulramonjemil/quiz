import Component from "../core/component"
import Header from "./header"
import styles from "../scss/quiz.module.scss"
import { uniqueId } from "../core/library"

export default class Quiz extends Component {
  static create() {
    return null
  }

  /** @protected */
  /* eslint-disable-next-line class-methods-use-this */
  $render() {
    const { headerContent } = this.$props
    const quizLabellingId = uniqueId()

    return (
      <section className={styles.quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{headerContent}</Header>
      </section>
    )
  }
}
