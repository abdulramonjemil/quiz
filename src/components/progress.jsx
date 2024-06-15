import Component from "../core/component"
import { attemptTabbableFocus } from "../lib/focus"
import Styles from "../scss/progress.module.scss"

const MAIN_PROGRESS_BRIDGE_PROPERTY = "width"
const PROGRESS_BRIDGE_PSEUDO_ELEMENT = "::after"
const PASSED_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_passed

/**
 * @typedef ProgressRevalidationOptions
 * @property {number} activeLevel
 * @property {number | null} highestEnabledLevel
 */

function ProgressLevel({
  levelNumber,
  handleLevelButtonClick,
  handleTransitionEnd,
  isPassed = false
}) {
  return (
    <li
      className={`${Styles.Progress__Level} ${
        isPassed ? PASSED_PROGRESS_LEVEL_CLASS : ""
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
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
  $handleProgressLevelTransitionEnd(ev) {
    const { propertyName, pseudoElement, target, type } = ev
    if (propertyName !== MAIN_PROGRESS_BRIDGE_PROPERTY) return
    if (pseudoElement !== PROGRESS_BRIDGE_PSEUDO_ELEMENT) return
    if (type !== "transitionend") return
    if (!target.matches(`.${Styles.Progress__Level}`)) return

    const { indexOfDeterminerLevel, isOccurring: changeIsOccurring } =
      this.$change
    if (!changeIsOccurring) return

    const eventIsForDeterminerLevel =
      target === this.$progressLevels[indexOfDeterminerLevel]
    if (!eventIsForDeterminerLevel) return

    this.$change.isOccurring = false
    this.$change.indexOfDeterminerLevel = null
  }

  $render() {
    const {
      $handleProgressLevelTransitionEnd,
      $props: { handleLevelButtonClick, levelsCount, startLevel }
    } = this

    this.$change = {
      /**
       * The index of the progress level that'll be used to determine whether
       * the progress can undergo changes.
       */
      indexOfDeterminerLevel: null,
      isOccurring: false
    }
    this.$currentProgressLevelIndex = null
    this.$progressLevels = []

    const progressLevels = []
    const handleTransitionEnd = $handleProgressLevelTransitionEnd.bind(this)
    let startLevelIsSet = false

    if (startLevel !== undefined) {
      if (
        !Number.isInteger(startLevel) ||
        startLevel <= 0 ||
        startLevel > levelsCount
      ) {
        throw new TypeError(`Invalid start level: ${startLevel}`)
      } else {
        startLevelIsSet = true
      }
    }

    for (let i = 1; i <= levelsCount; i += 1) {
      progressLevels.push(
        <ProgressLevel
          handleLevelButtonClick={handleLevelButtonClick.bind(null, i)}
          levelNumber={i}
          handleTransitionEnd={handleTransitionEnd}
          isPassed={startLevelIsSet && startLevel > i}
        />
      )
    }

    this.$currentProgressLevelIndex = startLevelIsSet ? startLevel - 1 : 0

    const progressNode = (
      /* The outer div is used to determine max-width of inner one in CSS */
      <div>
        <div className={Styles.Progress} aria-hidden="true">
          <ul className={Styles.Progress__List}>{[...progressLevels]}</ul>
        </div>
      </div>
    )

    this.$progressLevels = progressLevels

    return progressNode
  }

  /**
   * It's important to note that the parameter passed to `$setActiveLevel` is
   * not zero-based, and `$currentProgressLevelIndex` is zero-based
   */
  $setActiveLevel(levelNumber) {
    if (this.$change.isOccurring)
      throw new Error("Currently undergoing a change")

    if (!Number.isInteger(levelNumber) || levelNumber < 1)
      throw new TypeError("Expected level number to be a positive integer")

    const { $currentProgressLevelIndex, $progressLevels } = this

    if (levelNumber > $progressLevels.length)
      throw new RangeError(
        `There is no progress level with number: ${levelNumber}`
      )

    const currentLevelNumber = $currentProgressLevelIndex + 1
    if (levelNumber === currentLevelNumber) return

    this.$change.isOccurring = true

    if (levelNumber < currentLevelNumber) {
      const indexOfCurrentHighestPassedLevel = $currentProgressLevelIndex - 1
      const indexOfNextLevelToPassToSet = levelNumber - 1
      this.$change.indexOfDeterminerLevel = indexOfCurrentHighestPassedLevel

      for (
        let i = indexOfNextLevelToPassToSet;
        i <= indexOfCurrentHighestPassedLevel;
        i += 1
      ) {
        $progressLevels[i].classList.remove(PASSED_PROGRESS_LEVEL_CLASS)
      }
    } else {
      const indexOfHighestPassedLevelToSet = levelNumber - 2
      this.$change.indexOfDeterminerLevel = indexOfHighestPassedLevelToSet

      for (
        let i = $currentProgressLevelIndex;
        i <= indexOfHighestPassedLevelToSet;
        i += 1
      ) {
        $progressLevels[i].classList.add(PASSED_PROGRESS_LEVEL_CLASS)
      }
    }

    this.$currentProgressLevelIndex = levelNumber - 1
  }

  currentLevel() {
    return this.$currentProgressLevelIndex + 1
  }

  isChangeable() {
    return !this.$change.isOccurring
  }

  decrement() {
    const { $currentProgressLevelIndex } = this
    this.$setActiveLevel($currentProgressLevelIndex)
  }

  increment() {
    const { $currentProgressLevelIndex } = this
    this.$setActiveLevel($currentProgressLevelIndex + 2)
  }

  levelsCount() {
    return this.$progressLevels.length
  }

  restart() {
    this.$setActiveLevel(1)
  }

  /** @param {ProgressRevalidationOptions} options */
  revalidate(options) {
    const { activeLevel, highestEnabledLevel } = options
    this.$setActiveLevel(activeLevel)
    this.$progressLevels.forEach((progressLevel, index) => {
      const levelButton = /** @type {Element} */ (progressLevel).querySelector(
        "button"
      )

      levelButton.disabled =
        highestEnabledLevel === null ? false : index > highestEnabledLevel - 1
    })
  }

  setActiveLevel(levelNumber) {
    this.$setActiveLevel(levelNumber)
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
