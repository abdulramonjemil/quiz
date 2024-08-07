import { resolveToNode } from "@/jsx/base"
import { createInstrinsicElement } from "./intrinsic"
import { createComponentElement } from "./value-based"

/**
 * @typedef {import("@/jsx/base").JSXElementType} JSXElementType
 * @typedef {import("@/jsx/base").ElementProps} ElementProps
 */

/**
 * @param {Object} param0
 * @param {any} param0.children
 */
function Fragment({ children }) {
  return resolveToNode(children)
}

/**
 * Pass the 'key' as a prop directly to the resolver of the JSX element.
 * Also pass 'children' as a separate parameter to it instead of as a prop.
 *
 * @param {JSXElementType} type
 * @param {ElementProps} props
 * @param {string} [key]
 */
function jsx(type, props, key) {
  const { children, ...otherProps } = props
  const fProps = { ...otherProps, key }
  if (typeof type === "string") {
    return createInstrinsicElement(type, fProps, children)
  }

  if (typeof type === "function") {
    return createComponentElement(type, fProps, children)
  }

  throw new TypeError("JSX Element type must be a string or a function")
}

export { jsx, jsx as jsxs, Fragment }
