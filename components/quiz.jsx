import Component from "../core/component"

export default class Quiz extends Component {
  static create() {
    return null
  }

  /** @protected */
  $render() {
    return this.$children
  }
}
