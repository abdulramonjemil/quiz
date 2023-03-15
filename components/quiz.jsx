import Component, { createInstanceRefHolder } from "../core/component"
import Styles from "../scss/quiz.module.scss"
import Header from "./header"
import { uniqueId } from "../core/library"
import Progress from "./progress"
import Question from "./question"
import ControlPanel from "./control-panel"

export default class Quiz extends Component {
  static create(container) {
    container.replaceChildren(<Quiz headerContent="Your opinion matters" />)
  }

  /* eslint-disable-next-line class-methods-use-this */
  $render() {
    const { headerContent } = this.$props
    const quizLabellingId = uniqueId()
    const progressRefHolder = createInstanceRefHolder()

    const questionAnswer = "C"
    const questionTitle = "What do you think of my Hashnode Quiz widget?"
    const questionOptions = [
      "Who cares by the way? It's not my thing for the most part.",
      "It makes tiny sense",
      "~~Did you use `webpack` when creating it?",
      "Whatever"
    ]
    const questionFeedBack =
      "~~I've never for any reason loved to use `webpack`"

    const questionRefHolder = createInstanceRefHolder()
    const controlPanelRefHolder = createInstanceRefHolder()

    return (
      <section className={Styles.Quiz} aria-labelledby={quizLabellingId}>
        <Header labellingId={quizLabellingId}>{headerContent}</Header>
        <Progress levelsCount={5} refHolder={progressRefHolder} />
        <Question
          answer={questionAnswer}
          feedBackContent={questionFeedBack}
          options={questionOptions}
          refHolder={questionRefHolder}
          title={questionTitle}
        />
        {/* eslint-disable */}
        <ControlPanel
          handlePrevButtonClick={() => console.log("Clicking Prev")}
          handleNextButtonClick={() => console.log("Clicking Next")}
          handleSubmitButtonClick={() => console.log("Clicking Submit")}
          refHolder={controlPanelRefHolder}
        />
        {/* eslint-enable */}
      </section>
    )
  }
}
