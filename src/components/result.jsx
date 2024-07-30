import { refHolder } from "@/core/base"
import Component from "@/core/component"
import { css } from "@/lib/dom"
import styles from "@/scss/result.module.scss"
import ScrollShadow from "./scroll-shadow"

const Styles = /** @type {Record<string, string>} */ (styles)

/**
 * @typedef {{
 *   handleExplanationBtnClick: () => void,
 *   questionsCount: number
 * }} ResultProps
 */

const DEFAULT_RESULT_PERCENTAGE_VALUE = 0
const INDICATOR_CIRCLE_ANIMATION_DURATION_MS =
  Number(Styles.INDICATOR_CIRCLE_ANIMATION_DURATION_SECS) * 1000
const INDICATOR_CIRCLE_CIRCUMFERENCE = Number(
  Styles.INDICATOR_CIRCLE_CIRCUMFERENCE
)

const { INDICATOR_CIRCLE_FINAL_DASHOFFSET_CSS_VAR, RESULT_PERCENTAGE_CSS_VAR } =
  Styles

/** @type {string} */
const TRANSITION_ANIMATED_INDICATOR_CLASS = Styles.Indicator_transitionAnimated

/** @param {number} percentageValue */
function getIndicatorCircleDashoffset(percentageValue) {
  return ((100 - percentageValue) / 100) * INDICATOR_CIRCLE_CIRCUMFERENCE
}

function renderResultIndicator(
  indicator,
  percentValueContainer,
  scoredPercentage
) {
  const totalValueToAnimate = scoredPercentage - DEFAULT_RESULT_PERCENTAGE_VALUE
  let startTime = null
  let lastFrameTime = null

  function setPercentValue(time) {
    if (startTime === null) startTime = time
    const elapsedTime = time - startTime
    const shouldBeTheLastFrame =
      elapsedTime >= INDICATOR_CIRCLE_ANIMATION_DURATION_MS

    if (time !== lastFrameTime) {
      const percentValueToSet = shouldBeTheLastFrame
        ? scoredPercentage
        : Math.floor(
            DEFAULT_RESULT_PERCENTAGE_VALUE +
              (elapsedTime / INDICATOR_CIRCLE_ANIMATION_DURATION_MS) *
                totalValueToAnimate
          )

      // eslint-disable-next-line no-param-reassign
      percentValueContainer.innerText = percentValueToSet
      lastFrameTime = time
    }

    if (!shouldBeTheLastFrame) {
      window.requestAnimationFrame(setPercentValue)
    }
  }

  window.requestAnimationFrame(setPercentValue)
  // The settimeout is needed to trigger the animation by transition since
  // without it, the transition wouldn't take effect.
  setTimeout(() => {
    indicator.classList.add(TRANSITION_ANIMATED_INDICATOR_CLASS)
  }, 0)
}

function Indicator({ indicatorRenderFnRefHolder, scoredPercentage }) {
  const indicatorRefHolder = refHolder()
  const percentValueRefHolder = refHolder()
  const dashoffset = getIndicatorCircleDashoffset(scoredPercentage)

  const resultIndicatorNode = (
    <div
      className={Styles.Indicator}
      role="presentation"
      refHolder={indicatorRefHolder}
      style={css([
        [RESULT_PERCENTAGE_CSS_VAR, scoredPercentage],
        [INDICATOR_CIRCLE_FINAL_DASHOFFSET_CSS_VAR, dashoffset]
      ])}
    >
      <div className={Styles.Indicator__OuterShadow} />
      <div className={Styles.Indicator__InnerShadow} />
      <svg
        class={Styles.Indicator__SVG}
        height="100"
        version="1.1"
        viewBox="0 0 100 100"
        width="100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <linearGradient id={Styles.INDICATOR_CIRCLE_GRADIENT_ID}>
            <stop offset="0%" stop-color={Styles.RESULT_PRIMARY_COLOR} />
            <stop offset="100%" stop-color={Styles.RESULT_SECONDARY_COLOR} />
          </linearGradient>
        </defs>

        {/* Inspect this circle in devtools to see how the styling for it works */}
        <circle class={Styles.Indicator__Circle} cx="50" cy="50" r="50" />
      </svg>
      <div className={Styles.Indicator__Percent}>
        <span refHolder={percentValueRefHolder}>
          {DEFAULT_RESULT_PERCENTAGE_VALUE}
        </span>
        <span className={Styles.Indicator__PercentSymbol}>%</span>
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
  return resultIndicatorNode
}

function Remark({ answersGotten, handleExplanationBtnClick, questionsCount }) {
  return (
    <div className={Styles.Remark}>
      <p className={Styles.Remark__Text}>
        You answered <em>{answersGotten}</em> of <em>{questionsCount}</em>{" "}
        questions correctly. Please review explanations given for each question.
      </p>
      <button
        className={Styles.Remark__Button}
        onClick={handleExplanationBtnClick}
        type="submit"
      >
        Review Explanations
      </button>
    </div>
  )
}

/**
 * @template {ResultProps} [Props=ResultProps]
 * @extends {Component<Props>}
 */
export default class Result extends Component {
  $render() {
    const { handleExplanationBtnClick, questionsCount } = this.$props
    const placeholderRefHolder = refHolder()

    /** @type {(answersGotten: number) => void} */
    const finalizeResultFn = (answersGotten) => {
      const indicatorRenderFnRefHolder = {}
      const placeholder = /** @type {Element} */ (placeholderRefHolder.ref)
      const scoredPercentage = Math.floor(
        (answersGotten / questionsCount) * 100
      )

      const actualResultNode = (
        <ScrollShadow maxSizes={{ bottom: 25 }}>
          <div className={Styles.Result}>
            <Indicator
              scoredPercentage={scoredPercentage}
              indicatorRenderFnRefHolder={indicatorRenderFnRefHolder}
            />
            <Remark
              answersGotten={answersGotten}
              handleExplanationBtnClick={handleExplanationBtnClick}
              questionsCount={questionsCount}
            />
          </div>
        </ScrollShadow>
      )

      placeholder.replaceWith(actualResultNode)
      indicatorRenderFnRefHolder.ref.call()
    }

    const resultNode = (
      <div className={Styles.ResultWrapper}>
        <div refHolder={placeholderRefHolder} />
      </div>
    )

    this.$isFinalized = false
    this.$finalizeResultFn = finalizeResultFn
    return resultNode
  }

  /** @param {number} answersGotten */
  finalize(answersGotten) {
    this.$finalizeResultFn.call(null, answersGotten)
    this.$isFinalized = true
  }

  isFinalized() {
    return this.$isFinalized
  }
}
