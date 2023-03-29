import Component from "../core/component"
import Styles from "../scss/progress.module.scss"

const MAIN_PROGRESS_BRIDGE_PROPERTY = "width"
const PROGRESS_BRIDGE_PSEUDO_ELEMENT = "::after"
const PASSED_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_passed

/**
 * The index of the progress level that'll be used to determine whether the
 * progress can undergo changes when there are multiple changes made at the same
 * time, for example when transitioning all of the level back to their initial
 * state in order to restart.
 */
const INDEX_OF_MAIN_LEVEL_IN_MULTIPLE_CHANGES = 0

function ProgressLevel({ number, handleTransition, isPassed = false }) {
  return (
    <li
      className={`${Styles.Progress__Level} ${
        isPassed ? PASSED_PROGRESS_LEVEL_CLASS : ""
      }`}
      onTransitionStart={handleTransition}
      onTransitionEnd={handleTransition}
    >
      <div className={Styles.Progress__Number}>{number}</div>
    </li>
  )
}

export default class Progress extends Component {
  $handleProgressLevelTransition(ev) {
    const { propertyName, pseudoElement, target, type } = ev
    if (propertyName !== MAIN_PROGRESS_BRIDGE_PROPERTY) return
    if (pseudoElement !== PROGRESS_BRIDGE_PSEUDO_ELEMENT) return
    if (!target.matches(`.${Styles.Progress__Level}`)) return

    if (type === "transitionstart") {
      if (this.$isUndergoingGradualChange) this.$isChangeable = false
      else if (this.$isRestarting) {
        const transitionIsForMainProgressLevel =
          target ===
          this.$progressLevels[INDEX_OF_MAIN_LEVEL_IN_MULTIPLE_CHANGES]
        if (transitionIsForMainProgressLevel) this.$isChangeable = false
      }
    } else if (type === "transitionend") {
      if (this.$isUndergoingGradualChange) this.$isChangeable = true
      else if (this.$isRestarting) {
        const transitionIsForMainProgressLevel =
          target ===
          this.$progressLevels[INDEX_OF_MAIN_LEVEL_IN_MULTIPLE_CHANGES]
        if (transitionIsForMainProgressLevel) this.$isChangeable = true
      }
    }
  }

  $render() {
    this.$progressLevels = []
    this.$currentProgressLevelIndex = null
    this.$isChangeable = true
    this.$isRestarting = false
    this.$isUndergoingGradualChange = false

    const {
      $handleProgressLevelTransition,
      $props: { levelsCount, startLevel },
      $progressLevels
    } = this

    const handleTransition = $handleProgressLevelTransition.bind(this)
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
          handleTransition={handleTransition}
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

  isChangeable() {
    return this.$isChangeable
  }

  decrement() {
    if (!this.$isChangeable) throw new Error("Currently undergoing a change")
    this.$isRestarting = false
    this.$isUndergoingGradualChange = true

    const { $currentProgressLevelIndex, $progressLevels } = this
    const indexOfHighestDecrementableLevel = 1

    if ($currentProgressLevelIndex < indexOfHighestDecrementableLevel)
      throw new RangeError("No lower levels to reverse to")

    const lastPassedProgressLevelIndex = $currentProgressLevelIndex - 1
    const lastPassedProgressLevel =
      $progressLevels[lastPassedProgressLevelIndex]

    lastPassedProgressLevel.classList.remove(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = lastPassedProgressLevelIndex
  }

  increment() {
    if (!this.$isChangeable) throw new Error("Currently undergoing a change")
    this.$isRestarting = false
    this.$isUndergoingGradualChange = true

    const { $currentProgressLevelIndex, $progressLevels } = this
    const indexOfHighestIncrementableLevel = $progressLevels.length - 2

    if ($currentProgressLevelIndex > indexOfHighestIncrementableLevel)
      throw new RangeError("No higher levels to move to")

    const currentProgressLevel = $progressLevels[$currentProgressLevelIndex]
    currentProgressLevel.classList.add(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = $currentProgressLevelIndex + 1
  }

  restart() {
    if (!this.$isChangeable) throw new Error("Currently undergoing a change")
    this.$isUndergoingGradualChange = false
    this.$isRestarting = true

    const { $currentProgressLevelIndex, $progressLevels } = this
    if ($currentProgressLevelIndex === 0) return

    for (let i = 0; i < $currentProgressLevelIndex; i += 1)
      $progressLevels[i].classList.remove(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = 0
  }
}
