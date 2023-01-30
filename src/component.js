export default class Component {
  constructor(props, children) {
    /** @protected */
    this.$markup = this.$render(props, children)
  }

  /** @protected */
  $render() {
    throw new Error(
      `${this.constructor.name} does not implement the \`$render\` method`
    )
  }

  get markup() {
    return this.$markup
  }
}
