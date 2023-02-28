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

    return (
      <section className={styles.quiz}>
        <Header labellingId={uniqueId()}>{headerContent}</Header>
      </section>
    )
  }
}
