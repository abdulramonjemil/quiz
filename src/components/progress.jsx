import { Component, rh } from "@/jsx"
import {
  addClasses,
  attemptElementFocus,
  cn,
  hasClasses,
  removeClasses
} from "@/lib/dom"
import { assertIsDefined } from "@/lib/value"
import Styles from "@/scss/progress.module.scss"

const COMPLETION_LEVEL_BUTTON_CONTENT = "✓"

/**
 * @typedef {{
 *   levelsCount: number,
 *   lastAsCompletionLevel: boolean
 * }} ProgressProps
 *
 *
 * @typedef {{
 *   activeLevelIndex: number,
 *   highestEnabledLevelIndex: number | null,
 *   resolvedLevelIndices: number[]
 * }} ProgressRevalidationOptions
 */

const progressClasses = {
  root: cn("quiz-progress", Styles.Progress),
  list: cn("quiz-progress-list", Styles.Progress__List),
  level: {
    base: cn("quiz-progress-level", Styles.Progress__Level),
    active: cn("quiz-progress-level--active", Styles.Progress__Level_active),
    resolved: cn([
      "quiz-progress-level--resolved",
      Styles.Progress__Level_resolved
    ])
  },
  levelButton: cn("quiz-progress-level-button", Styles.Progress__LevelButton)
}

/**
 * @param {number} levelIndex
 * @param {HTMLElement[]} progressLevels
 */
function assertValidLevelIndex(levelIndex, progressLevels) {
  if (
    !Number.isInteger(levelIndex) ||
    levelIndex < 0 ||
    levelIndex > progressLevels.length - 1
  ) {
    throw new Error(`There is no progress level with index: ${levelIndex}`)
  }
}

/** @param {HTMLElement} progressLevel  */
function getLevelButton(progressLevel) {
  const button = progressLevel.querySelector("button")
  if (!(button instanceof HTMLButtonElement)) {
    throw new Error("Cannot find button in progress level")
  }
  return button
}

/** @param {HTMLElement} progressLevel  */
function levelIsCompletionLevel(progressLevel) {
  return (
    getLevelButton(progressLevel).innerText === COMPLETION_LEVEL_BUTTON_CONTENT
  )
}

/** @param {HTMLElement[]} progressLevels */
function getActiveLevelIndex(progressLevels) {
  const index = progressLevels.findIndex((level) =>
    hasClasses(level, progressClasses.level.active)
  )
  return index >= 0 ? index : null
}

/**
 * @param {HTMLElement} progressLevel
 * @param {"active" | "non-active"} state
 */
function setProgressLevelState(progressLevel, state) {
  if (state === "active") {
    addClasses(progressLevel, progressClasses.level.active)
  } else if (state === "non-active") {
    removeClasses(progressLevel, progressClasses.level.active)
  }
}

/**
 * @param {HTMLElement[]} progressLevels
 * @param {number[]} resolvedLevelIndices
 */
function setResolvedLevels(progressLevels, resolvedLevelIndices) {
  const set = new Set(resolvedLevelIndices)
  progressLevels.forEach((level, index) => {
    if (set.has(index)) addClasses(level, progressClasses.level.resolved)
    else removeClasses(level, progressClasses.level.resolved)
  })
}

/**
 * Sets the highest enabled progress level. Other levels at indexes higher than
 * the passed level index are disabled. If `null` is passed, all levels are enabled.
 *
 * @param {HTMLElement[]} progressLevels
 * @param {number | null} levelIndex
 */
function setHigestEnabledLevelIndex(progressLevels, levelIndex) {
  if (levelIndex !== null) assertValidLevelIndex(levelIndex, progressLevels)
  progressLevels.forEach((progressLevel, index) => {
    const levelButton = getLevelButton(progressLevel)
    levelButton.disabled = levelIndex === null ? false : index > levelIndex
  })
}

/**
 * @param {HTMLElement[]} progressLevels
 * @param {number} levelIndex
 */
function setActiveLevel(progressLevels, levelIndex) {
  assertValidLevelIndex(levelIndex, progressLevels)

  const prevIndex = getActiveLevelIndex(progressLevels)
  const levelToSet = /** @type {HTMLElement} */ (progressLevels[levelIndex])

  setProgressLevelState(levelToSet, "active")
  if (prevIndex !== levelIndex && prevIndex !== null) {
    const prevLevel = /** @type {HTMLElement} */ (progressLevels[prevIndex])
    setProgressLevelState(prevLevel, "non-active")
  }
}

/**
 * @param {Object} param0
 * @param {string | number} param0.buttonContent
 */
function ProgressLevel({ buttonContent }) {
  return (
    <li className={progressClasses.level.base}>
      <button className={cn(progressClasses.levelButton)} type="button">
        {buttonContent}
      </button>
    </li>
  )
}

/**
 * @template {ProgressProps} [Props=ProgressProps]
 * @extends {Component<Props>}
 */
export default class Progress extends Component {
  /** @param {Props} props  */
  constructor(props) {
    const { levelsCount, lastAsCompletionLevel } = props

    /** @type {HTMLElement[]} */
    const progressLevels = []

    for (let i = 0; i < levelsCount; i += 1) {
      const isCompletionLevel = lastAsCompletionLevel && i === levelsCount - 1

      const level = (
        <ProgressLevel
          buttonContent={
            isCompletionLevel ? COMPLETION_LEVEL_BUTTON_CONTENT : i + 1
          }
        />
      )
      progressLevels.push(/** @type {HTMLElement} */ (level))
    }

    const listRootRH = /** @type {typeof rh<HTMLUListElement>} */ (rh)(null)
    const progressNode = (
      <div className={progressClasses.root}>
        <ul className={progressClasses.list} refHolder={listRootRH}>
          {[...progressLevels]}
        </ul>
      </div>
    )

    super(props, progressNode)

    /** @type {HTMLUListElement} */
    this._listRoot = listRootRH.ref
    /** @type {HTMLElement[]} */
    this._progressLevels = progressLevels
  }

  activeLevelIndex() {
    return getActiveLevelIndex(this._progressLevels)
  }

  elements() {
    return {
      listRoot: /** @type {HTMLElement} */ (this._listRoot),
      buttons: this._progressLevels.map((level) => getLevelButton(level))
    }
  }

  hasCompletionLevel() {
    const lastProgressLevel =
      this._progressLevels[this._progressLevels.length - 1]
    assertIsDefined(lastProgressLevel, "last progress level")
    return levelIsCompletionLevel(lastProgressLevel)
  }

  levelsCount() {
    return this._progressLevels.length
  }

  /** @param {ProgressRevalidationOptions} options */
  revalidate(options) {
    const { activeLevelIndex, highestEnabledLevelIndex, resolvedLevelIndices } =
      options
    setActiveLevel(this._progressLevels, activeLevelIndex)
    setHigestEnabledLevelIndex(this._progressLevels, highestEnabledLevelIndex)
    setResolvedLevels(this._progressLevels, resolvedLevelIndices)
  }

  /**
   * @param {number} levelIndex
   */
  simulateClick(levelIndex) {
    assertValidLevelIndex(levelIndex, this._progressLevels)
    const level = /** @type {HTMLElement} */ (this._progressLevels[levelIndex])
    const levelButton = getLevelButton(level)
    const focused = attemptElementFocus(levelButton)
    levelButton.click()
    return focused
  }
}
