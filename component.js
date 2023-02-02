export default class Component {
  constructor(props, children) {
    /** @protected */
    this.$props = props

    /** @protected */
    this.$children = children

    /** @protected */
    this.$componentElement = this.$render(props, children)
  }

  get componentElement() {
    return this.$componentElement
  }

  /** @protected */
  $render() {
    throw new Error(
      `${this.constructor.name} does not implement the \`$render\` method`
    )
  }

  reRender() {
    const newComponentElement = this.$render()
    this.$componentElement.replaceWith(newComponentElement)
    this.$componentElement = newComponentElement
  }
}
