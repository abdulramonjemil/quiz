import Component from "../core/component"
import Styles from "../scss/progress.module.scss"

const MAIN_PROGRESS_BRIDGE_PROPERTY = "width"
const PROGRESS_BRIDGE_PSEUDO_ELEMENT = "::after"
const PASSED_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_passed

function ProgressLevel({ number, handleTransitionEnd, isPassed = false }) {
  return (
    <li
      className={`${Styles.Progress__Level} ${
        isPassed ? PASSED_PROGRESS_LEVEL_CLASS : ""
      }`}
      onTransitionEnd={handleTransitionEnd}
    >
      <div className={Styles.Progress__Number}>{number}</div>
    </li>
  )
}

export default class Progress extends Component {
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
    this.$progressLevels = []
    this.$currentProgressLevelIndex = null

    this.$change = {
      /**
       * The index of the progress level that'll be used to determine whether
       * the progress can undergo changes.
       */
      indexOfDeterminerLevel: null,
      isOccurring: false
    }

    const {
      $handleProgressLevelTransitionEnd,
      $props: { levelsCount, startLevel },
      $progressLevels
    } = this

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
      $progressLevels.push(
        <ProgressLevel
          number={i}
          handleTransitionEnd={handleTransitionEnd}
          isPassed={startLevelIsSet && startLevel > i}
        />
      )
    }

    this.$currentProgressLevelIndex = startLevelIsSet ? startLevel - 1 : 0

    return (
      /* The outer div is used to determine max-width of inner one in CSS */
      <div>
        <div className={Styles.Progress} aria-hidden="true">
          <ul className={Styles.Progress__List}>{[...$progressLevels]}</ul>
        </div>
      </div>
    )
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

  restart() {
    this.$setActiveLevel(1)
  }

  setActiveLevel(levelNumber) {
    this.$setActiveLevel(levelNumber)
  }
}
