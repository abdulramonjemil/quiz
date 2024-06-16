import Component from "../core/component"
import { attemptTabbableFocus } from "../lib/focus"
import Styles from "../scss/progress.module.scss"

const ACTIVE_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_active

/**
 * @typedef ProgressRevalidationOptions
 * @property {number} activeLevel
 * @property {number | null} highestEnabledLevel
 */

function ProgressLevel({ levelNumber, handleLevelButtonClick }) {
  return (
    <li className={Styles.Progress__Level}>
      <button
        className={Styles.Progress__NumberButton}
        onClick={handleLevelButtonClick}
        type="button"
      >
        {levelNumber}
      </button>
    </li>
  )
}

export default class Progress extends Component {
  $render() {
    const {
      $props: { handleLevelButtonClick, levelsCount, activeLevel }
    } = this

    this.$currentProgressLevelIndex = null
    this.$progressLevels = []

    const progressLevels = []

    for (let i = 1; i <= levelsCount; i += 1) {
      progressLevels.push(
        <ProgressLevel
          handleLevelButtonClick={handleLevelButtonClick.bind(null, i)}
          levelNumber={i}
        />
      )
    }

    const progressNode = (
      <div className={Styles.Progress} aria-hidden="true">
        <ul className={Styles.Progress__List}>{[...progressLevels]}</ul>
      </div>
    )

    let activeLevelIsProvided = false

    if (activeLevel !== undefined) {
      if (
        !Number.isInteger(activeLevel) ||
        activeLevel <= 0 ||
        activeLevel > levelsCount
      ) {
        throw new TypeError(`Invalid start level: ${activeLevel}`)
      } else {
        activeLevelIsProvided = true
      }
    }

    this.$progressLevels = progressLevels
    this.$currentProgressLevelIndex = activeLevelIsProvided
      ? activeLevel - 1
      : 0
    this.$setActiveLevel(activeLevel)

    return progressNode
  }

  /** @param {number} levelNumber */
  $setActiveLevel(levelNumber) {
    if (!Number.isInteger(levelNumber) || levelNumber < 1)
      throw new TypeError("Expected level number to be a positive integer")

    const { $progressLevels } = this

    if (levelNumber > $progressLevels.length) {
      throw new RangeError(
        `There is no progress level with number: ${levelNumber}`
      )
    }

    const levelIndex = levelNumber - 1

    const prevActiveLevel = $progressLevels.find((level) =>
      level.classList.contains(ACTIVE_PROGRESS_LEVEL_CLASS)
    )

    if (prevActiveLevel) {
      prevActiveLevel.classList.remove(ACTIVE_PROGRESS_LEVEL_CLASS)
    }

    $progressLevels[levelIndex].classList.add(ACTIVE_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = levelIndex
  }

  /** @param {number | null} levelNumber  */
  $setHigestEnabledLevel(levelNumber) {
    const { $progressLevels } = this

    $progressLevels.forEach((progressLevel, index) => {
      const levelButton = /** @type {Element} */ (progressLevel).querySelector(
        "button"
      )

      levelButton.disabled =
        levelNumber === null ? false : index > levelNumber - 1
    })
  }

  currentLevel() {
    return this.$currentProgressLevelIndex + 1
  }

  levelsCount() {
    return this.$progressLevels.length
  }

  /** @param {ProgressRevalidationOptions} options */
  revalidate(options) {
    const { activeLevel, highestEnabledLevel } = options
    this.$setActiveLevel(activeLevel)
    this.$setHigestEnabledLevel(highestEnabledLevel || null)
  }

  /**
   * @param {number} progressLevel - A 1-index based progress level to click
   */
  simulateClick(progressLevel) {
    const levelButton =
      this.$progressLevels[progressLevel - 1]?.querySelector("button")

    if (levelButton) {
      attemptTabbableFocus(levelButton)
      levelButton.click()
      return true
    }

    return false
  }
}
