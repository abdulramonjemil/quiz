import { throwAbsentMethodError } from "@/lib/value"
import { resolveToNode } from "./base"

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

    /**
     * @readonly
     * @protected
     * @type {Node} */
    this.$composedNode = resolveToNode(this.$render())
  }

  $render() {
    // Method must be overwritten by extenders
    throwAbsentMethodError(this.constructor, "$render")
  }

  rootNode() {
    return this.$composedNode
  }
}
