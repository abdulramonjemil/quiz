import Component from "../core/component"
import Styles from "../scss/progress.module.scss"

const MAIN_PROGRESS_BRIDGE_PROPERTY = "width"
const PROGRESS_BRIDGE_PSEUDO_ELEMENT = "::after"
const PASSED_PROGRESS_LEVEL_CLASS = Styles.Progress__Level_passed

function ProgressLevel({ number, handleTransition }) {
  return (
    <li
      className={Styles.Progress__Level}
      onTransitionStart={handleTransition}
      onTransitionEnd={handleTransition}
    >
      <div className={Styles.Progress__Number}>{number}</div>
    </li>
  )
}

export default class Progress extends Component {
  $handleTransition(ev) {
    const { propertyName, pseudoElement, type } = ev
    if (propertyName !== MAIN_PROGRESS_BRIDGE_PROPERTY) return
    if (pseudoElement !== PROGRESS_BRIDGE_PSEUDO_ELEMENT) return
    if (type === "transitionstart") this.$isChangeable = false
    if (type === "transitionend") this.$isChangeable = true
  }

  $render() {
    this.$progressLevels = []
    this.$currentProgressLevelIndex = 0
    this.$isChangeable = true

    const {
      $handleTransition,
      $props: { levelsCount },
      $progressLevels
    } = this

    const handleTransition = $handleTransition.bind(this)
    for (let i = 0; i < levelsCount; i += 1) {
      $progressLevels.push(
        <ProgressLevel number={i + 1} handleTransition={handleTransition} />
      )
    }

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

    const { $currentProgressLevelIndex, $progressLevels } = this
    const indexOfHighestIncrementableLevel = $progressLevels.length - 2

    if ($currentProgressLevelIndex > indexOfHighestIncrementableLevel)
      throw new RangeError("No higher levels to move to")

    const currentProgressLevel = $progressLevels[$currentProgressLevelIndex]
    currentProgressLevel.classList.add(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = $currentProgressLevelIndex + 1
  }

  restart() {
    const { $currentProgressLevelIndex, $progressLevels } = this
    if ($currentProgressLevelIndex === 0) return

    for (let i = 0; i < $currentProgressLevelIndex; i += 1)
      $progressLevels[i].classList.remove(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = 0
  }
}
