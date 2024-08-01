/**
 * @typedef {import("./component").Component} Component
 */

/**
 * @typedef {string} JSXIntrinsicElementType
 * @typedef {(props: any) => any} JSXFunctionElementType
 * @typedef {new (props: any) => Component} JSXClassElementType
 *
 * @typedef {(
 *   | JSXIntrinsicElementType
 *   | JSXFunctionElementType
 *   | JSXClassElementType
 * )} JSXElementType
 *
 * @typedef {{
 *   [x: string]: unknown
 *   children?: unknown,
 * }} ElementProps
 */

/** @param {unknown} value */
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
