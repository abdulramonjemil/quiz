import Component, { createInstanceRefHolder } from "../core/component"
import styles from "../scss/quiz.module.scss"
import Header from "./header"
import { uniqueId } from "../core/library"
import Progress from "./progress"
import Question from "./question"

export default class Quiz extends Component {
  static create() {
    return null
  }

  /* eslint-disable-next-line class-methods-use-this */
  $render() {
    const { headerContent } = this.$props
    const quizLabellingId = uniqueId()
    const progressRefHolder = createInstanceRefHolder()

    const questionTitle = "What do you think of my Hashnode Quiz widget?"
    const questionOptions = [
      "It makes sense",
      "Utter garbage",
      "Whatever",
      "Who cares"
    ]

    return (
      <section className={styles.quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{headerContent}</Header>
        <Progress levelsCount={7} refHolder={progressRefHolder} />
        <Question title={questionTitle} questionOptions={questionOptions} />
      </section>
    )
  }
}
