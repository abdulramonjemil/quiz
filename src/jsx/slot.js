import { resolveToNode } from "./base"
import { Component } from "./component"

/**
 * @typedef {(...params: any[]) => any} SlotRevalidator
 */

/**
 * @template {SlotRevalidator} [R=SlotRevalidator]
 * @typedef {{
 *   placeholder: unknown,
 *   children: R
 * }} SlotProps
 */

/**
 * @template {SlotRevalidator} [R=SlotRevalidator]
 * @extends {Component<SlotProps<R>>}
 */
export class Slot extends Component {
  /** @param {SlotProps<R>} props  */
  constructor(props) {
    const { placeholder } = props
    const node = resolveToNode(placeholder)
    super(props, node)
  }

  /** @param {Parameters<SlotProps<R>["children"]>} params  */
  revalidate(...params) {
    const revalidator = this.$props.children
    const value = revalidator.call(null, ...params)
    if (value === undefined) return
    const valueNode = resolveToNode(value)
    this.$rootNode.parentNode?.replaceChild(valueNode, this.$rootNode)
    this.$rootNode = valueNode
  }
}
