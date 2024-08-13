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
    if (new.target === Component) {
      throw new Error("An instance of 'Component' cannot be created directly")
    }

    /**
     * @readonly
     * @protected
     * @type {Props}
     */
    this._props = props

    /**
     * @protected
     * @type {Node} */
    this._rootNode = resolveToNode(node)
  }

  rootNode() {
    return this._rootNode
  }
}
