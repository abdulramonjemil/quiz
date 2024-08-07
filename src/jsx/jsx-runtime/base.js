/**
 * @typedef {import("@/jsx/base").ElementProps} ElementProps
 */

/**
 * @typedef {Omit<ElementProps, "children">} NormalizedElementProps
 * @typedef {ElementProps["children"]} ElementChildren
 */

export const Namespaces = /** @type {const} */ ({
  html: "http://www.w3.org/1999/xhtml",
  svg: "http://www.w3.org/2000/svg",
  mathml: "http://www.w3.org/1998/Math/MathML"
})
