export default class Component {
  constructor(props, children) {
    /** @protected */
    this.$markup = this.$render(props, children)
  }

  get markup() {
    return this.$markup
  }

  /** @protected */
  $render() {
    throw new Error(
      `${this.constructor.name} does not implement the \`$render\` method`
    )
  }

  reRender() {
    const newMarkup = this.$render()
    this.$markup.replaceWith(newMarkup)
    this.$markup = newMarkup
  }
}
