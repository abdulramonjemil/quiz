import { resolveToNode } from "./base"

/**
 * @typedef {import("./base").ElementProps} ComponentProps
 */

/**
 * This class is used as an abstract class that actual
 * UI components extend.
 *
 * @template {ComponentProps} [Props=ComponentProps]
 */
export class Component {
  /**
   * @param {Props} props
   * @param {any} node
   */
  constructor(props, node) {
    if (new.target === Component)
      throw new Error("An instance of 'Component' cannot be created directly")

    if (typeof props !== "object" || props === null) {
      throw new TypeError("'props' must be an object")
    }

    /**
     * @readonly
     * @protected
     * @type {Props}
     */
    this.$props = props

    /**
     * @protected
     * @type {Node} */
    this.$rootNode = resolveToNode(node)
  }

  rootNode() {
    return this.$rootNode
  }
}
