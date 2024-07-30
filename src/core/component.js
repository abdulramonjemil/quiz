import { throwAbsentMethodError } from "@/lib/value"
import { resolveToNode } from "./base"

/**
 * @typedef {Record<string, unknown>} ComponentProps
 * @typedef {unknown} ComponentChildren
 */

/**
 * This class is used as an abstract class that actual
 * UI components extend.
 *
 * @template {ComponentProps} [Props=ComponentProps]
 * @template {ComponentChildren} [Children=ComponentChildren]
 */
export default class Component {
  /**
   * @param {Props} props
   * @param {Children} children
   */
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

    /**
     * @readonly
     * @protected
     * @type {Children}
     */
    this.$children = children

    /**
     * @protected
     * @type {Node} */
    this.$rootNode = resolveToNode(this.$render())
  }

  $render() {
    // Method must be overwritten by extenders
    throwAbsentMethodError(this.constructor, "$render")
  }

  rootNode() {
    return this.$rootNode
  }
}
