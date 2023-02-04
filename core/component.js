const REF_DEFAULT_VALUE = null
const REF_OBJECT_MAIN_KEY = "ref"

const REF = Symbol("REF")

export default class Component {
  constructor(props, children) {
    /** @protected */
    this.$props = props

    /** @protected */
    this.$children = children

    /** @protected */
    this.$composedNode = this.$render(props, children)
  }

  /** @private */
  static $$getElementRef() {
    return this[REF]
  }

  /** @private */
  static $$getInstanceRef() {
    return this[REF]
  }

  /** @private */
  static $$setElementRef(value) {
    const currentRef = this[REF]
    if (currentRef !== REF_DEFAULT_VALUE)
      throw new Error("refs cannot be set twice")

    if (!(value instanceof Element))
      throw new TypeError("element ref must be an instance of 'Element'")
    this[REF] = value
  }

  /** @private */
  static $$setInstanceRef(value) {
    const currentRef = this[REF]
    if (currentRef !== REF_DEFAULT_VALUE)
      throw new Error("refs cannot be set twice")

    if (!(value instanceof Component))
      throw new TypeError("instance ref must be an instance of 'Component'")
    this[REF] = value
  }

  static createElementRefObject() {
    const elementRefObject = {}
    const { $$getElementRef, $$setElementRef } = Component

    Object.defineProperties(elementRefObject, {
      [REF_OBJECT_MAIN_KEY]: {
        enumerable: false,
        configurable: false,
        get: $$getElementRef,
        set: $$setElementRef
      },
      [REF]: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: REF_DEFAULT_VALUE
      }
    })
    return elementRefObject
  }

  static createInstanceRefObject() {
    const instanceRefObject = {}
    const { $$getInstanceRef, $$setInstanceRef } = Component

    Object.defineProperties(instanceRefObject, {
      [REF_OBJECT_MAIN_KEY]: {
        enumerable: false,
        configurable: false,
        get: $$getInstanceRef,
        set: $$setInstanceRef
      },
      [REF]: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: REF_DEFAULT_VALUE
      }
    })
    return instanceRefObject
  }

  static isElementRefObject(value) {
    if (typeof value !== "object") return false
    const objectPropertyDescriptors = Object.getOwnPropertyDescriptors(value)

    const {
      [REF_OBJECT_MAIN_KEY]: descriptorForMainKey,
      [REF]: descriptorForRef
    } = objectPropertyDescriptors

    if (descriptorForMainKey === undefined || descriptorForRef === undefined)
      return false

    if (descriptorForMainKey.configurable !== false) return false
    if (
      descriptorForRef.writable !== true ||
      descriptorForRef.configurable !== false
    )
      return false

    const { get: definedElementRefGetter, set: definedElementRefSetter } =
      descriptorForMainKey
    const { $$getElementRef, $$setElementRef } = Component

    if (definedElementRefGetter !== $$getElementRef) return false
    if (definedElementRefSetter !== $$setElementRef) return false
    return true
  }

  static isInstanceRefObject(value) {
    if (typeof value !== "object") return false
    const objectPropertyDescriptors = Object.getOwnPropertyDescriptors(value)

    const {
      [REF_OBJECT_MAIN_KEY]: descriptorForMainKey,
      [REF]: descriptorForRef
    } = objectPropertyDescriptors

    if (descriptorForMainKey === undefined || descriptorForRef === undefined)
      return false

    if (descriptorForMainKey.configurable !== false) return false
    if (
      descriptorForRef.writable !== true ||
      descriptorForRef.configurable !== false
    )
      return false

    const { get: definedInstanceRefGetter, set: definedInstanceRefSetter } =
      descriptorForMainKey
    const { $$getInstanceRef, $$setInstanceRef } = Component

    if (definedInstanceRefGetter !== $$getInstanceRef) return false
    if (definedInstanceRefSetter !== $$setInstanceRef) return false
    return true
  }

  get composedNode() {
    return this.$composedNode
  }

  /** @protected */
  $render() {
    // Method must be overidden by extenders
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
