const REF_DEFAULT_VALUE = null
const REF_HOLDER_MAIN_KEY = "ref"
const REF = Symbol("REF")

export function resolveToNode(value) {
  if (value instanceof Node) return value
  if (typeof value === "boolean" || value === null || value === undefined)
    return document.createTextNode("")
  if (Array.isArray(value)) {
    const fragment = new DocumentFragment()
    fragment.append(...value.map((val) => resolveToNode(val)))
    return fragment
  }
  return document.createTextNode(String(value))
}

/**
 * This class is used as an abstract class that actual
 * UI components extend.
 *
 * @template {ComponentProps} [Props=Record<string, unknown>]
 */
export default class Component {
  constructor(props, children) {
    if (new.target === Component)
      throw new Error("An instance of 'Component' cannot be created directly")

    if (typeof props !== "object" || props === null)
      throw new TypeError("'props' must be an object")

    /**
     * @readonly
     * @protected
     * @type {Props}
     */
    this.$props = props

    this.$children = children

    /** @type {Node} */
    this.$composedNode = resolveToNode(this.$render())
  }

  static $$createRefHolder(refGetter, refSetter) {
    const refHolder = {}

    Object.defineProperties(refHolder, {
      [REF_HOLDER_MAIN_KEY]: {
        enumerable: false,
        configurable: false,
        get: refGetter,
        set: refSetter
      },
      [REF]: {
        enumerable: false,
        configurable: false,
        writable: true,
        value: REF_DEFAULT_VALUE
      }
    })
    return refHolder
  }

  static $$getElementRef() {
    return this[REF]
  }

  static $$getInstanceRef() {
    return this[REF]
  }

  static $$isRefHolder(value, appropriateRefGetter, appropriateRefSetter) {
    if (typeof value !== "object") return false
    const objectPropertyDescriptors = Object.getOwnPropertyDescriptors(value)

    const {
      [REF_HOLDER_MAIN_KEY]: descriptorForMainKey,
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

    const { get: definedRefGetter, set: definedRefSetter } =
      descriptorForMainKey

    if (definedRefGetter !== appropriateRefGetter) return false
    if (definedRefSetter !== appropriateRefSetter) return false
    return true
  }

  static $$setElementRef(value) {
    const currentRef = this[REF]
    if (currentRef !== REF_DEFAULT_VALUE)
      throw new Error("refs cannot be set twice")

    if (!(value instanceof Element))
      throw new TypeError("element ref must be an instance of 'Element'")
    this[REF] = value
  }

  static $$setInstanceRef(value) {
    const currentRef = this[REF]
    if (currentRef !== REF_DEFAULT_VALUE)
      throw new Error("refs cannot be set twice")

    if (!(value instanceof Component))
      throw new TypeError("instance ref must be an instance of 'Component'")
    this[REF] = value
  }

  static createElementRefHolder() {
    const { $$getElementRef, $$createRefHolder, $$setElementRef } = Component
    return $$createRefHolder($$getElementRef, $$setElementRef)
  }

  static createInstanceRefHolder() {
    const { $$getInstanceRef, $$createRefHolder, $$setInstanceRef } = Component
    return $$createRefHolder($$getInstanceRef, $$setInstanceRef)
  }

  static isElementRefHolder(value) {
    const { $$getElementRef, $$isRefHolder, $$setElementRef } = Component
    return $$isRefHolder(value, $$getElementRef, $$setElementRef)
  }

  static isInstanceRefHolder(value) {
    const { $$getInstanceRef, $$isRefHolder, $$setInstanceRef } = Component
    return $$isRefHolder(value, $$getInstanceRef, $$setInstanceRef)
  }

  get composedNode() {
    return this.$composedNode
  }

  $render() {
    // Method must be overwritten by extenders
    throw new Error(
      `'${this.constructor.name}' does not implement the \`$render\` method`
    )
  }
}

export const {
  createElementRefHolder,
  createInstanceRefHolder,
  isElementRefHolder,
  isInstanceRefHolder
} = Component
