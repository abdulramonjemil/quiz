import { Component, Slot, ns, rh } from "@/jsx"
import { contentNode } from "@/core/content"
import { addClasses, cn, css } from "@/lib/dom"
import Styles from "@/scss/result.module.scss"
import ScrollShadow from "./scroll-shadow"

/**
 * @typedef {(questionsCount: number, answersGotten: number) => string} GetSummaryText
 * @typedef {{
 *   questionsCount: number,
 *   animateIndicator?: boolean | undefined
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
  root: cn("quiz-result", Styles.Result),
  inner: cn("quiz-result-inner", Styles.Result__Inner),
  indicatorRoot: {
    base: cn("quiz-result-indicator", Styles.Indicator),
    rendered: cn("quiz-result-indicator--rendered", Styles.Indicator_rendered)
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
  indicatorGradientStop1: cn([
    "quiz-result-indicator-gradient-stop-1",
    Styles.Indicator__GradientStop1
  ]),
  indicatorGradientStop2: cn([
    "quiz-result-indicator-gradient-stop-2",
    Styles.Indicator__GradientStop2
  ]),
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
  summaryCTA: cn(["quiz-result-summary-cta", Styles.Summary__Cta]),
  summaryCTAArrow: cn([
    "quiz-result-summary-cta-arrow",
    Styles.Summary__CtaArrow
  ])
}

/**
 * @param {Object} param0
 * @param {HTMLElement} param0.indicator
 * @param {(value: number) => void} param0.setPercentValue
 * @param {number} param0.scoredPercentage
 * @param {boolean | undefined} [param0.animate]
 */
function renderResultIndicator({
  indicator,
  scoredPercentage,
  setPercentValue,
  animate = true
}) {
  const duration = INDICATOR_CIRCLE_ANIMATION_DURATION_MS
  const minIncrement = scoredPercentage >= 50 ? 4 : 2

  let startTime = /** @type {DOMHighResTimeStamp | null} */ (null)
  let lastFrameTime = /** @type {DOMHighResTimeStamp | null} */ (0)
  let lastPercentValue = 0

  /** @param {DOMHighResTimeStamp} time */
  const renderFrame = (time) => {
    if (startTime === null) startTime = time
    const elapsedTime = time - startTime
    const animationShouldStop = elapsedTime >= duration

    if (time === lastFrameTime) {
      if (!animationShouldStop) window.requestAnimationFrame(renderFrame)
      return
    }

    const nextPercentValue = animationShouldStop
      ? scoredPercentage
      : Math.floor((elapsedTime / duration) * scoredPercentage)

    if (
      nextPercentValue - lastPercentValue >= minIncrement ||
      nextPercentValue === scoredPercentage
    ) {
      setPercentValue(nextPercentValue)
      lastPercentValue = nextPercentValue
    }

    lastFrameTime = time
    if (!animationShouldStop) window.requestAnimationFrame(renderFrame)
  }

  if (animate === true) {
    setPercentValue(0)
    window.requestAnimationFrame(renderFrame)
    setTimeout(() => {
      addClasses(indicator, resultClasses.indicatorRoot.rendered)
    }, 0)
  } else {
    setPercentValue(scoredPercentage)
    addClasses(indicator, resultClasses.indicatorRoot.rendered)
  }
}

/** @param {number} scoredPercentage */
function getCircleDashoffset(scoredPercentage) {
  return ((100 - scoredPercentage) / 100) * INDICATOR_CIRCLE_CIRCUMFERENCE
}

/**
 * @param {Object} param0
 * @param {boolean | undefined} param0.animate
 * @param {number} param0.scoredPercentage
 */
function Indicator({ scoredPercentage, animate }) {
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
        xmlns={ns.svg()}
      >
        <defs>
          <linearGradient id={Styles.INDICATOR_CIRCLE_GRADIENT_ID}>
            <stop offset="0%" class={resultClasses.indicatorGradientStop1} />
            <stop offset="100%" class={resultClasses.indicatorGradientStop2} />
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

  renderResultIndicator({
    scoredPercentage,
    animate,
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
function Summary({
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
            {contentNode(getSummaryText(questionsCount, answersGotten))}
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
        className={resultClasses.summaryCTA}
        onClick={handleCTAButtonClick}
        type="submit"
      >
        Review Answers <span className={resultClasses.summaryCTAArrow}>⟶</span>
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
    const {
      getSummaryText,
      handleCTAButtonClick,
      animateIndicator,
      questionsCount
    } = props

    const resultNode = (
      <div className={resultClasses.root}>
        <RSlot instanceRefHolder={slotRH} placeholder={<div />}>
          {(answersGotten) => {
            const scoredPercentage = Math.floor(
              (answersGotten / questionsCount) * 100
            )
            return (
              <ScrollShadow>
                <div className={resultClasses.inner}>
                  <Indicator
                    animate={animateIndicator}
                    scoredPercentage={scoredPercentage}
                  />
                  <Summary
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
    this._slot = slotRH.ref
    /** @private */
    this._isFinalized = false
  }

  /** @param {number} answersGotten */
  finalize(answersGotten) {
    if (this._isFinalized) return
    this._slot.revalidate(answersGotten)
    this._isFinalized = true
  }

  isFinalized() {
    return this._isFinalized
  }
}
