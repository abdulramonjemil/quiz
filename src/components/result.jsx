import Component from "@/core/component"
import { rh } from "@/core/base"
import { phraseToNode } from "@/core/content-parser"
import { Slot } from "@/core/slot"
import { addClasses, cn, css } from "@/lib/dom"
import Styles from "@/scss/result.module.scss"
import ScrollShadow from "./scroll-shadow"

/**
 * @typedef {(questionsCount: number, answersGotten: number) => string} GetSummaryText
 * @typedef {{
 *   questionsCount: number,
 *   getSummaryText?: GetSummaryText | null | undefined,
 *   handleCTAButtonClick: (event: MouseEvent) => void,
 * }} ResultProps
 */

const INDICATOR_CIRCLE_ANIMATION_DURATION_MS =
  Number(Styles.INDICATOR_CIRCLE_ANIMATION_DURATION_SECS) * 1000
const INDICATOR_CIRCLE_CIRCUMFERENCE = Number(
  Styles.INDICATOR_CIRCLE_CIRCUMFERENCE
)

// eslint-disable-next-line prefer-destructuring
const INDICATOR_CIRCLE_FINAL_DASHOFFSET_CSS_VAR = /** @type {string} */ (
  Styles.INDICATOR_CIRCLE_FINAL_DASHOFFSET_CSS_VAR
)

// eslint-disable-next-line prefer-destructuring
const RESULT_PERCENTAGE_CSS_VAR = /** @type {string} */ (
  Styles.RESULT_PERCENTAGE_CSS_VAR
)

const resultClasses = {
  wrapper: cn("quiz-result-wrapper", Styles.ResultWrapper),
  root: cn("quiz-result", Styles.Result),
  indicatorRoot: {
    base: cn("quiz-result-indicator", Styles.Indicator),
    transitionAnimated: cn(
      "quiz-result-indicator--animated",
      Styles.Indicator_transitionAnimated
    )
  },
  indicatorOuterShadow: cn([
    "quiz-result-indicator-outershadow",
    Styles.Indicator__OuterShadow
  ]),
  indicatorInnerShadow: cn([
    "quiz-result-indicator-innershadow",
    Styles.Indicator__InnerShadow
  ]),
  indicatorSVG: cn("quiz-result-indicator-svg", Styles.Indicator__SVG),
  indicatorCircle: cn("quiz-result-indicator-circle", Styles.Indicator__Circle),
  indicatorPercent: cn([
    "quiz-result-indicator-percent",
    Styles.Indicator__Percent
  ]),
  indicatorPercentSymbol: cn([
    "quiz-result-indicator-percent-symbol",
    Styles.Indicator__PercentSymbol
  ]),
  summaryRoot: cn("quiz-result-summary", Styles.Summary),
  summaryText: cn("quiz-result-summary-text", Styles.Summary__Text),
  summaryButton: cn("quiz-result-summary-button", Styles.Summary__Button)
}

/**
 * @param {Object} param0
 * @param {HTMLElement} param0.indicator
 * @param {(value: number) => void} param0.setPercentValue
 * @param {number} param0.scoredPercentage
 */
function animateIndicatorPercentValue({
  indicator,
  scoredPercentage,
  setPercentValue
}) {
  const duration = INDICATOR_CIRCLE_ANIMATION_DURATION_MS
  let startTime = /** @type {DOMHighResTimeStamp | null} */ (null)
  let lastFrameTime = /** @type {DOMHighResTimeStamp | null} */ (0)

  /** @param {DOMHighResTimeStamp} time */
  const animate = (time) => {
    if (startTime === null) startTime = time
    const elapsedTime = time - startTime
    const animationShouldStop = elapsedTime >= duration

    if (time === lastFrameTime) {
      if (!animationShouldStop) window.requestAnimationFrame(animate)
      return
    }

    const nextPercentValue = animationShouldStop
      ? scoredPercentage
      : Math.floor((elapsedTime / duration) * scoredPercentage)
    setPercentValue(nextPercentValue)
    lastFrameTime = time
    if (!animationShouldStop) window.requestAnimationFrame(animate)
  }

  window.requestAnimationFrame(animate)
  setTimeout(() => {
    addClasses(indicator, resultClasses.indicatorRoot.transitionAnimated)
  }, 0)
}

/** @param {number} scoredPercentage */
function getCircleDashoffset(scoredPercentage) {
  return ((100 - scoredPercentage) / 100) * INDICATOR_CIRCLE_CIRCUMFERENCE
}

/**
 * @param {Object} param0
 * @param {number} param0.scoredPercentage
 */
function Indicator({ scoredPercentage }) {
  const indicatorRH = /** @type {typeof rh<HTMLElement>} */ (rh)(null)
  const percentValueRH = /** @type {typeof rh<HTMLElement>} */ (rh)(null)
  const dashoffset = getCircleDashoffset(scoredPercentage)

  const indicatorNode = (
    <div
      className={resultClasses.indicatorRoot.base}
      role="presentation"
      refHolder={indicatorRH}
      style={css([
        [RESULT_PERCENTAGE_CSS_VAR, scoredPercentage],
        [INDICATOR_CIRCLE_FINAL_DASHOFFSET_CSS_VAR, dashoffset]
      ])}
    >
      <div className={resultClasses.indicatorOuterShadow} />
      <div className={resultClasses.indicatorInnerShadow} />
      <svg
        class={resultClasses.indicatorSVG}
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
        <circle class={resultClasses.indicatorCircle} cx="50" cy="50" r="50" />
      </svg>

      <div className={resultClasses.indicatorPercent}>
        <span refHolder={percentValueRH} />
        <span className={resultClasses.indicatorPercentSymbol}>%</span>
      </div>
    </div>
  )

  animateIndicatorPercentValue({
    scoredPercentage,
    indicator: indicatorRH.ref,
    setPercentValue: (value) => {
      percentValueRH.ref.innerText = `${value}`
    }
  })
  return indicatorNode
}

/**
 * @param {Object} param0
 * @param {number} param0.answersGotten
 * @param {ResultProps["getSummaryText"]} param0.getSummaryText
 * @param {(event: MouseEvent) => void} param0.handleCTAButtonClick
 * @param {number} param0.questionsCount
 */
function Remark({
  answersGotten,
  questionsCount,
  getSummaryText,
  handleCTAButtonClick
}) {
  const encouragement = (() => {
    const percent = Math.floor((answersGotten / questionsCount) * 100)
    if (percent < 20) return "Keep trying!"
    if (percent < 40) return "Good start!"
    if (percent < 60) return "Well done!"
    if (percent < 80) return "Great effort!"
    if (percent !== 100) return "Almost there!"
    return "Excellent!"
  })()

  return (
    <div className={resultClasses.summaryRoot}>
      <p className={resultClasses.summaryText}>
        {getSummaryText && (
          <span>
            {phraseToNode(getSummaryText(questionsCount, answersGotten))}
          </span>
        )}
        {!getSummaryText && (
          <span>
            {encouragement} You correctly answered <em>{answersGotten}</em> of{" "}
            <em>{questionsCount}</em> questions. Take a moment to review your
            answers.
          </span>
        )}
      </p>
      <button
        className={resultClasses.summaryButton}
        onClick={handleCTAButtonClick}
        type="submit"
      >
        Review Answers
      </button>
    </div>
  )
}

/**
 * @template {ResultProps} [Props=ResultProps]
 * @extends {Component<Props>}
 */
export default class Result extends Component {
  /** @param {Props} props */
  constructor(props) {
    /** @typedef {(answersGotten: number) => any} Finalizer */
    const RSlot = /** @type {typeof Slot<Finalizer>} */ (Slot)
    const slotRH = /** @type {typeof rh<Slot<Finalizer>>} */ (rh)(null)
    const { getSummaryText, handleCTAButtonClick, questionsCount } = props

    const resultNode = (
      <div className={resultClasses.wrapper}>
        <RSlot instanceRefHolder={slotRH} placeholder={<div />}>
          {(answersGotten) => {
            const scoredPercentage = Math.floor(
              (answersGotten / questionsCount) * 100
            )
            return (
              <ScrollShadow maxSizes={{ bottom: 25 }}>
                <div className={resultClasses.root}>
                  <Indicator scoredPercentage={scoredPercentage} />
                  <Remark
                    answersGotten={answersGotten}
                    getSummaryText={getSummaryText}
                    handleCTAButtonClick={handleCTAButtonClick}
                    questionsCount={questionsCount}
                  />
                </div>
              </ScrollShadow>
            )
          }}
        </RSlot>
      </div>
    )

    super(props, resultNode)
    /** @private */
    this.$slot = slotRH.ref
    /** @private */
    this.$isFinalized = false
  }

  /** @param {number} answersGotten */
  finalize(answersGotten) {
    if (this.$isFinalized) return
    this.$slot.revalidate(answersGotten)
    this.$isFinalized = true
  }

  isFinalized() {
    return this.$isFinalized
  }
}
