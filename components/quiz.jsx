import Component, { createInstanceRefHolder } from "../core/component"
import Header from "./header"
import styles from "../scss/quiz.module.scss"
import { uniqueId } from "../core/library"
import Progress from "./progress"

export default class Quiz extends Component {
  static create() {
    return null
  }

  /* eslint-disable-next-line class-methods-use-this */
  $render() {
    const { headerContent } = this.$props
    const quizLabellingId = uniqueId()
    const progressRefHolder = createInstanceRefHolder()

    return (
      <section className={styles.quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{headerContent}</Header>
        <Progress levelsCount={7} refHolder={progressRefHolder} />
      </section>
    )
  }
}
