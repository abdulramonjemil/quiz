import { resolveToNode } from "../lib/dom"

const REF_DEFAULT_VALUE = null
const REF_HOLDER_MAIN_KEY = "ref"
const REF = Symbol("REF")

export default class Component {
  constructor(props, children) {
    if (new.target === Component)
      throw new Error("An instance of 'Component' cannot be created directly")

    if (typeof props !== "object" || props === null)
      throw new TypeError("'props' must be an object")

    this.$props = props

    this.$children = children

    /** @type {Node} */
    this.$composedNode = null
    this.reset()
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

  reset() {
    const newNode = resolveToNode(this.$render())
    const currentComposedNode = this.$composedNode
    const parentOfComposedNode = currentComposedNode?.parentNode

    if (parentOfComposedNode instanceof Node)
      parentOfComposedNode.replaceChild(newNode, currentComposedNode)
    this.$composedNode = newNode
  }

  use(props, children, childrenCanBeUndefined = false) {
    let passedNewProps = false
    let passedNewChildren = false

    if (props !== undefined && props !== null) {
      if (typeof props !== "object")
        throw new TypeError("'props' must be an object")
      passedNewProps = true
      this.$props = { ...this.$props, ...props }
    }

    if (children !== undefined || childrenCanBeUndefined) {
      passedNewChildren = true
      this.$children = children
    }

    if (!passedNewProps && !passedNewChildren)
      throw new Error("No new props or children to use")

    this.reset()
  }
}

export const {
  createElementRefHolder,
  createInstanceRefHolder,
  isElementRefHolder,
  isInstanceRefHolder
} = Component
