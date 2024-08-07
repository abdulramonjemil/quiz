/**
 * @typedef {import("@/jsx/base").ElementProps} ElementProps
 */

/**
 * @typedef {Omit<ElementProps, "children">} NormalizedElementProps
 * @typedef {ElementProps["children"]} ElementChildren
 */

export const Namespaces = /** @type {const} */ ({
  mathml: "http://www.w3.org/1998/Math/MathML",
  svg: "http://www.w3.org/2000/svg"
})

export const SpecialIntrinsicProps = /** @type {const} */ ({
  interfaceRH: "refHolder",
  nodeRH: "nodeRefHolder",
  namespace: "xmlns"
})

export const SpecialComponentProps = /** @type {const} */ ({
  instanceRH: "instanceRefHolder",
  nodeRH: "nodeRefHolder"
})
