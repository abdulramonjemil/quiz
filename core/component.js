/* eslint-disable-next-line import/no-cycle */
import { resolveToNode } from "./jsx-runtime"
import { isObject } from "./helpers"

const REF_DEFAULT_VALUE = null
const REF_HOLDER_MAIN_KEY = "ref"
const REF = Symbol("REF")

export default class Component {
  constructor(props, children) {
    if (new.target === Component)
      throw new Error("An instance of 'Component' cannot be created directly")

    if (!isObject(props)) throw new TypeError("'props' must be an object")

    /** @protected */
    this.$props = props

    /** @protected */
    this.$children = children

    /** @protected */
    this.$composedNode = this.$$render()
  }

  /** @private */
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

  /** @private */
  static $$getElementRef() {
    return this[REF]
  }

  /** @private */
  static $$getInstanceRef() {
    return this[REF]
  }

  /** @private */
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

  /** @private */
  $$render() {
    return resolveToNode(this.$render())
  }

  /** @protected */
  $render() {
    // Method must be overidden by extenders
    throw new Error(
      `'${this.constructor.name}' does not implement the \`$render\` method`
    )
  }

  reRender(overwritingProps, newChildren, useUndefinedChildren = false) {
    if (overwritingProps !== undefined && overwritingProps !== null) {
      if (typeof overwritingProps !== "object")
        throw new TypeError("'overwritingProps' must be an object")
      this.$props = { ...this.$props, ...overwritingProps }
    }

    if (newChildren !== undefined || useUndefinedChildren)
      this.$children = newChildren

    const newComposedNode = this.$$render()
    const currentComposedNode = this.$composedNode
    const parentOfComposedNode = currentComposedNode.parentNode

    if (parentOfComposedNode !== null)
      parentOfComposedNode.replaceChild(newComposedNode, currentComposedNode)
    this.$composedNode = newComposedNode
  }
}

export const {
  createElementRefHolder,
  createInstanceRefHolder,
  isElementRefHolder,
  isInstanceRefHolder
} = Component
