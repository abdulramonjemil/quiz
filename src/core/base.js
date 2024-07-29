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

/**
 * @template {any} T
 * @typedef {{ ref: T }} RefHolder
 */

/**
 * @template {any} T
 * @param {T} value
 * @returns {RefHolder<T>}
 */
export function refHolder(value = undefined) {
  return { ref: value }
}

/** @type {<T extends any>(value: any) => value is RefHolder<T>} */
export function isRefHolder(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, "ref")
  )
}
