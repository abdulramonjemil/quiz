import Component from "../core/component"
import { attemptTabbableFocus } from "../lib/focus"
import Styles from "../scss/progress.module.scss"

const ACTIVE_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_active
const PRECEDING_COMPLETION_LEVEL_CLASS =
  Styles.Progress__Level_precedingCompletion

/**
 * @typedef ProgressRevalidationOptions
 * @property {number} activeLevel
 * @property {number | null} highestEnabledLevel
 */

function ProgressLevel({
  buttonContent,
  handleLevelButtonClick,
  isCompletionLevel = false
}) {
  return (
    <li
      className={
        Styles.Progress__Level +
        (isCompletionLevel ? ` ${Styles.Progress__Level_completion}` : "")
      }
    >
      <button
        className={Styles.Progress__LevelButton}
        onClick={handleLevelButtonClick}
        type="button"
      >
        {buttonContent}
      </button>
    </li>
  )
}

export default class Progress extends Component {
  $render() {
    const {
      $props: { handleLevelButtonClick, levelsCount, activeLevel }
    } = this

    this.$activeProgressLevelIndex = null
    this.$progressLevels = []

    const progressLevels = []

    for (let i = 1; i <= levelsCount; i += 1) {
      progressLevels.push(
        <ProgressLevel
          handleLevelButtonClick={handleLevelButtonClick.bind(null, i)}
          buttonContent={i}
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

    /** @type {HTMLElement[]} */
    this.$progressLevels = progressLevels
    this.$activeProgressLevelIndex = activeLevelIsProvided ? activeLevel - 1 : 0

    // Required to be called after setting the properties above
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
    this.$activeProgressLevelIndex = levelIndex
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

  addCompletionLevel() {
    const listElement = this.$composedNode.querySelector("ul")
    if (!(listElement instanceof HTMLUListElement)) return

    const levelNode = (
      <ProgressLevel
        buttonContent="✔"
        handleLevelButtonClick={() => {}}
        isCompletionLevel
      />
    )

    this.$progressLevels[this.$progressLevels.length - 1].classList.add(
      PRECEDING_COMPLETION_LEVEL_CLASS
    )

    listElement.appendChild(levelNode)
    this.$progressLevels.push(levelNode)
    this.$setHigestEnabledLevel(null)
  }

  activeLevelIndex() {
    return this.$activeProgressLevelIndex
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
