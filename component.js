const ELEMENT_REF_SYMBOLS = {
  KEY: Symbol("ELEMENT_REF_SYMBOL_KEY"),
  VALUE: Symbol("ELEMENT_REF_SYMBOL_VALUE")
}

const INSTANCE_REF_SYMBOLS = {
  KEY: Symbol("INSTANCE_REF_SYMBOL_KEY"),
  VALUE: Symbol("INSTANCE_REF_SYMBOL_VALUE")
}

const REF_OBJECT_MAIN_KEY = "ref"

export default class Component {
  constructor(props, children) {
    /** @protected */
    this.$props = props

    /** @protected */
    this.$children = children

    /** @protected */
    this.$composedNode = this.$render(props, children)
  }

  static createElementRefObject() {
    const elementRef = { [REF_OBJECT_MAIN_KEY]: null }
    Object.defineProperty(elementRef, ELEMENT_REF_SYMBOLS.KEY, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: ELEMENT_REF_SYMBOLS.VALUE
    })
    return elementRef
  }

  static createInstanceRefObject() {
    const instanceRef = { [REF_OBJECT_MAIN_KEY]: null }
    Object.defineProperty(instanceRef, INSTANCE_REF_SYMBOLS.KEY, {
      enumerable: false,
      configurable: false,
      writable: false,
      value: INSTANCE_REF_SYMBOLS.VALUE
    })
    return instanceRef
  }

  static isElementRefObject(value) {
    if (typeof value !== "object") return false
    const refSymbolValue = Object.getOwnPropertyDescriptor(
      value,
      ELEMENT_REF_SYMBOLS.KEY
    )?.value

    if (refSymbolValue !== ELEMENT_REF_SYMBOLS.VALUE) return false
    if (!Object.prototype.hasOwnProperty.call(value, REF_OBJECT_MAIN_KEY))
      return false
    return true
  }

  static isInstanceRefObject(value) {
    if (typeof value !== "object") return false
    const refSymbolValue = Object.getOwnPropertyDescriptor(
      value,
      INSTANCE_REF_SYMBOLS.KEY
    )?.value

    if (refSymbolValue !== INSTANCE_REF_SYMBOLS.VALUE) return false
    if (!Object.prototype.hasOwnProperty.call(value, REF_OBJECT_MAIN_KEY))
      return false
    return true
  }

  get composedNode() {
    return this.$composedNode
  }

  /** @protected */
  $render() {
    throw new Error(
      `'${this.constructor.name}' does not implement the \`$render\` method`
    )
  }

  reRender() {
    const newComposedNode = this.$render()
    this.$composedNode.replaceWith(newComposedNode)
    this.$composedNode = newComposedNode
  }
}

export const {
  createElementRefObject,
  createInstanceRefObject,
  isElementRefObject,
  isInstanceRefObject
} = Component
