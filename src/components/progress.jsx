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
  $handleProgressLevelTransitionEnd(ev) {
    const { propertyName, pseudoElement, target, type } = ev
    if (propertyName !== MAIN_PROGRESS_BRIDGE_PROPERTY) return
    if (pseudoElement !== PROGRESS_BRIDGE_PSEUDO_ELEMENT) return
    if (!target.matches(`.${Styles.Progress__Level}`)) return

    const { $changeDetails, $isChanging } = this
    if (!$isChanging || type !== "transitionend") return

    if ($changeDetails.isGradualChange) {
      this.$isChanging = false
      return
    }

    const eventIsForDeterminerLevel =
      target === this.$progressLevels[$changeDetails.indexOfDeterminerLevel]
    if (eventIsForDeterminerLevel) this.$isChanging = false
  }

  $render() {
    this.$progressLevels = []
    this.$currentProgressLevelIndex = null
    this.$isChanging = false

    this.$changeDetails = {
      /**
       * The index of the progress level that'll be used to determine whether the
       * progress can undergo changes when there are multiple changes made at the same
       * time, for example when transitioning all of the level back to their initial
       * state in order to restart.
       */
      indexOfDeterminerLevel: null,
      isGradualChange: null
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

  isChangeable() {
    return !this.$isChanging
  }

  decrement() {
    if (this.$isChanging) throw new Error("Currently undergoing a change")

    const { $currentProgressLevelIndex, $progressLevels } = this
    const indexOfHighestDecrementableLevel = 1

    if ($currentProgressLevelIndex < indexOfHighestDecrementableLevel)
      throw new RangeError("No lower levels to reverse to")

    this.$isChanging = true
    this.$changeDetails.isGradualChange = true

    const lastPassedProgressLevelIndex = $currentProgressLevelIndex - 1
    const lastPassedProgressLevel =
      $progressLevels[lastPassedProgressLevelIndex]

    lastPassedProgressLevel.classList.remove(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = lastPassedProgressLevelIndex
  }

  increment() {
    if (this.$isChanging) throw new Error("Currently undergoing a change")

    const { $currentProgressLevelIndex, $progressLevels } = this
    const indexOfHighestIncrementableLevel = $progressLevels.length - 2

    if ($currentProgressLevelIndex > indexOfHighestIncrementableLevel)
      throw new RangeError("No higher levels to move to")

    this.$isChanging = true
    this.$changeDetails.isGradualChange = true

    const currentProgressLevel = $progressLevels[$currentProgressLevelIndex]
    currentProgressLevel.classList.add(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = $currentProgressLevelIndex + 1
  }

  restart() {
    if (this.$isChanging) throw new Error("Currently undergoing a change")

    this.$isChanging = true
    this.$changeDetails.isGradualChange = false
    this.$changeDetails.indexOfDeterminerLevel = 0

    const { $currentProgressLevelIndex, $progressLevels } = this
    if ($currentProgressLevelIndex === 0) return

    for (let i = 0; i < $currentProgressLevelIndex; i += 1)
      $progressLevels[i].classList.remove(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = 0
  }
}
