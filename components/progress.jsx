import Component from "../core/component"
import styles from "../scss/progress.module.scss"

const MAIN_PROGRESS_BRIDGE_PROPERTY = "width"
const PROGRESS_BRIDGE_PSEUDO_ELEMENT = "::after"
const PASSED_PROGRESS_LEVEL_CLASS = styles["progress__level--passed"]

export default class Progress extends Component {
  $handleTransition(ev) {
    const { propertyName, pseudoElement, type } = ev
    if (propertyName !== MAIN_PROGRESS_BRIDGE_PROPERTY) return
    if (pseudoElement !== PROGRESS_BRIDGE_PSEUDO_ELEMENT) return
    if (type === "transitionstart") this.$hasRunningTransitions = true
    if (type === "transitionend") this.$hasRunningTransitions = false
  }

  $render() {
    this.$progressLevels = []
    this.$currentProgressLevelIndex = 0
    this.$hasRunningTransitions = false

    const {
      $handleTransition,
      $props: { levelsCount },
      $progressLevels
    } = this

    const handleTransition = $handleTransition.bind(this)
    for (let i = 0; i < levelsCount; i += 1) {
      $progressLevels.push(
        <li
          className={styles.progress__level}
          onTransitionStart={handleTransition}
          onTransitionEnd={handleTransition}
        >
          <div className={styles.progress__number}>{i + 1}</div>
        </li>
      )
    }

    return (
      <div className={styles.progress} role="presentation">
        <ul className={styles.progress__list}>{[...$progressLevels]}</ul>
      </div>
    )
  }

  hasRunningTransitions() {
    return this.$hasRunningTransitions
  }

  decrement() {
    if (this.$hasRunningTransitions)
      throw new Error("Currently undergoing a change")

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
    if (this.$hasRunningTransitions)
      throw new Error("Currently undergoing a change")

    const { $currentProgressLevelIndex, $progressLevels } = this
    const indexOfHighestIncrementableLevel = $progressLevels.length - 2

    if ($currentProgressLevelIndex > indexOfHighestIncrementableLevel)
      throw new RangeError("No higher levels to move to")

    const currentProgressLevel = $progressLevels[$currentProgressLevelIndex]
    currentProgressLevel.classList.add(PASSED_PROGRESS_LEVEL_CLASS)
    this.$currentProgressLevelIndex = $currentProgressLevelIndex + 1
  }
}
