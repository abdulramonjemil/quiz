import Component, { createElementRefHolder } from "../core/component"
import Styles from "../scss/result.module.scss"

const DEFAULT_RESULT_PERCENTAGE_VALUE = 0
const {
  PROPERTY_FOR_SCORED_PERCENTAGE,
  Indicator_rendered: RENDERED_INDICATOR_CLASS,
  DURATION_OF_INDICATOR_ANIMATION_SECS
} = Styles

function renderResultIndicator(
  indicator,
  percentValueContainer,
  scoredPercentage
) {
  // Duration in milliseconds
  const indicatorAnimationDurationToUse =
    Number(DURATION_OF_INDICATOR_ANIMATION_SECS) * 1000 - 100

  const intervalToIncrementPercentValue =
    indicatorAnimationDurationToUse /
    (scoredPercentage - DEFAULT_RESULT_PERCENTAGE_VALUE)

  let lastSetValue = DEFAULT_RESULT_PERCENTAGE_VALUE
  const intervalID = setInterval(() => {
    lastSetValue += 1
    // eslint-disable-next-line no-param-reassign
    percentValueContainer.innerText = lastSetValue
    if (lastSetValue === scoredPercentage) clearInterval(intervalID)
  }, intervalToIncrementPercentValue)
  indicator.classList.add(RENDERED_INDICATOR_CLASS)
}

function ResultIndicator({ indicatorRenderFnRefHolder, scoredPercentage }) {
  const indicatorRefHolder = createElementRefHolder()
  const percentValueRefHolder = createElementRefHolder()

  const resultIndicatorHTML = (
    <div
      className={Styles.Indicator}
      role="presentation"
      refHolder={indicatorRefHolder}
      style={`${PROPERTY_FOR_SCORED_PERCENTAGE}: ${scoredPercentage};`}
    >
      <div className={Styles.Indicator__OuterShadow} />
      <div className={Styles.Indicator__InnerShadow} />
      <svg
        class={Styles.Indicator__Graphic}
        height="100"
        version="1.1"
        viewBox="0 0 100 100"
        width="100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={Styles.INDICATOR_BAR_GRADIENT_ID}>
            <stop offset="0%" stop-color={Styles.RESULT_GREEN_COLOR} />
            <stop offset="100%" stop-color={Styles.RESULT_PINK_COLOR} />
          </linearGradient>
        </defs>
        <circle class={Styles.Indicator__Bar} cx="50" cy="50" r="50" />
      </svg>
      <div className={Styles.Indicator__Text}>
        <span
          className={Styles.Indicator__PercentValue}
          refHolder={percentValueRefHolder}
        >
          {DEFAULT_RESULT_PERCENTAGE_VALUE}
        </span>
        <span className={Styles.Indicator__PercentSign}>%</span>
      </div>
    </div>
  )

  // eslint-disable-next-line no-param-reassign
  indicatorRenderFnRefHolder.ref = renderResultIndicator.bind(
    null,
    indicatorRefHolder.ref,
    percentValueRefHolder.ref,
    scoredPercentage
  )
  return resultIndicatorHTML
}

function ResultBoard({
  answersGotten,
  handleExplanationsReview,
  questionsCount
}) {
  return (
    <div className={Styles.Result__Board}>
      <p className={Styles.Result__Instructions}>
        You answered <em>{answersGotten}</em> of <em>{questionsCount}</em>{" "}
        questions correctly. Please review explanations given for each question.
      </p>
      <button
        className={Styles.Result__ReviewButton}
        onClick={handleExplanationsReview}
        type="submit"
      >
        Review Explanations
      </button>
    </div>
  )
}

export default class Result extends Component {
  $render() {
    const { answersGotten, handleExplanationsReview, questionsCount } =
      this.$props
    const scoredPercentage = Math.floor((answersGotten / questionsCount) * 100)
    const indicatorRenderFnRefHolder = {}

    const resultHTML = (
      <div className={Styles.ResultContainer}>
        <div className={Styles.Result}>
          <ResultIndicator
            scoredPercentage={scoredPercentage}
            indicatorRenderFnRefHolder={indicatorRenderFnRefHolder}
          />
          <ResultBoard
            answersGotten={answersGotten}
            handleExplanationsReview={handleExplanationsReview}
            questionsCount={questionsCount}
          />
        </div>
      </div>
    )

    this.$indicatorRenderFn = indicatorRenderFnRefHolder.ref
    return resultHTML
  }

  renderIndicator() {
    this.$indicatorRenderFn.call()
  }
}
