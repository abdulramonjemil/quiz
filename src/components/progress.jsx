import Component, { createElementRefHolder } from "../core/component"
import { attemptElementFocus } from "../lib/dom"
import Styles from "../scss/progress.module.scss"

const ACTIVE_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_active
const COMPLETION_LEVEL_BUTTON_CONTENT = "✓"

/**
 * @param {levelIndex} number
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
function getLevelButtonContent(progressLevel) {
  const button = getLevelButton(progressLevel)
  return button.innerText
}

/**
 * @typedef ProgressRevalidationOptions
 * @property {number} activeLevelIndex
 * @property {number | null} highestEnabledLevelIndex
 */

function ProgressLevel({
  buttonContent,
  precedesCompletionLevel,
  isCompletionLevel
}) {
  return (
    <li
      className={
        Styles.Progress__Level +
        (precedesCompletionLevel
          ? ` ${Styles.Progress__Level_precedingCompletion}`
          : "") +
        (isCompletionLevel ? ` ${Styles.Progress__Level_completion}` : "")
      }
    >
      <button className={Styles.Progress__LevelButton} type="button">
        {buttonContent}
      </button>
    </li>
  )
}

export default class Progress extends Component {
  $render() {
    const {
      $props: { levelsCount, lastAsCompletionLevel }
    } = this

    /** @type {HTMLElement[]} */
    const progressLevels = []

    for (let i = 0; i < levelsCount; i += 1) {
      const isCompletionLevel = lastAsCompletionLevel && i === levelsCount - 1
      const isSecondToLastLevel = i === levelsCount - 2

      progressLevels.push(
        <ProgressLevel
          buttonContent={
            isCompletionLevel ? (
              <span style="color: inherit; font-weight: 700;">
                {COMPLETION_LEVEL_BUTTON_CONTENT}
              </span>
            ) : (
              i + 1
            )
          }
          precedesCompletionLevel={lastAsCompletionLevel && isSecondToLastLevel}
          isCompletionLevel={isCompletionLevel}
        />
      )
    }

    const listRootRefHolder = createElementRefHolder()
    const progressNode = (
      <div className={Styles.Progress} aria-hidden="true">
        <ul className={Styles.Progress__List} refHolder={listRootRefHolder}>
          {[...progressLevels]}
        </ul>
      </div>
    )

    /** @type {HTMLElement} */
    this.$listRoot = listRootRefHolder.ref
    /** @type {HTMLElement[]} */
    this.$progressLevels = progressLevels
    /** @type {number} */
    this.$activeProgressLevelIndex = 0

    return progressNode
  }

  /** @param {number} levelIndex */
  $setActiveLevelIndex(levelIndex) {
    const { $progressLevels } = this
    assertValidLevelIndex(levelIndex, $progressLevels)

    const prevActiveLevel = $progressLevels.find((level) =>
      level.classList.contains(ACTIVE_PROGRESS_LEVEL_CLASS)
    )

    if (prevActiveLevel) {
      prevActiveLevel.classList.remove(ACTIVE_PROGRESS_LEVEL_CLASS)
    }

    $progressLevels[levelIndex].classList.add(ACTIVE_PROGRESS_LEVEL_CLASS)
    this.$activeProgressLevelIndex = levelIndex
  }

  /** @param {number | null} levelIndex  */
  $setHigestEnabledLevelIndex(levelIndex) {
    const { $progressLevels } = this
    if (levelIndex !== null) assertValidLevelIndex(levelIndex, $progressLevels)

    $progressLevels.forEach((progressLevel, index) => {
      const levelButton = getLevelButton(progressLevel)
      levelButton.disabled = levelIndex === null ? false : index > levelIndex
    })
  }

  activeLevelIndex() {
    return this.$activeProgressLevelIndex
  }

  elements() {
    return {
      listRoot: /** @type {HTMLElement} */ (this.$listRoot),
      buttons: this.$progressLevels.map((level) => getLevelButton(level))
    }
  }

  hasCompletionLevel() {
    const lastProgressLevel =
      this.$progressLevels[this.$progressLevels.length - 1]
    return (
      getLevelButtonContent(lastProgressLevel) ===
      COMPLETION_LEVEL_BUTTON_CONTENT
    )
  }

  levelsCount() {
    return this.$progressLevels.length
  }

  /** @param {ProgressRevalidationOptions} options */
  revalidate(options) {
    const { activeLevelIndex, highestEnabledLevelIndex } = options
    this.$setActiveLevelIndex(activeLevelIndex)
    this.$setHigestEnabledLevelIndex(highestEnabledLevelIndex)
  }

  /**
   * @param {number} levelIndex
   */
  simulateClick(levelIndex) {
    assertValidLevelIndex(levelIndex, this.$progressLevels)
    const levelButton = getLevelButton(this.$progressLevels[levelIndex])
    const focused = attemptElementFocus(levelButton)
    levelButton.click()
    return focused
  }
}
