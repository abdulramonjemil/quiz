import { uniqueId } from "@/lib/id"
import { resolveToNode } from "./base"
import { isRH } from "./ref"

/**
 * @typedef {import("./base").JSXIntrinsicElementType} JSXIntrinsicElementType
 * @typedef {import("./base").JSXFunctionElementType} JSXFunctionElementType
 * @typedef {import("./base").JSXClassElementType} JSXClassElementType
 * @typedef {import("./base").JSXElementType} JSXElementType
 * @typedef {import("./base").ElementProps} ElementProps
 *
 * @typedef {import("./component").Component} Component
 * @typedef {import("./component").ComponentProps} ComponentProps
 */

/**
 * @typedef {Omit<ElementProps, "children">} NormalizedElementProps
 * @typedef {ElementProps["children"]} ElementChildren
 */

/** Only usable via `element.property` */
const IntrinsicElementPropertyAPIOnlyAttrs = ["className", "htmlFor"]

const Namespaces = /** @type {const} */ ({
  mathml: "http://www.w3.org/1998/Math/MathML",
  svg: "http://www.w3.org/2000/svg"
})

const SpecialIntrinsicProps = /** @type {const} */ ({
  interfaceRH: "refHolder",
  nodeRH: "nodeRefHolder",
  namespace: "xmlns"
})

const SpecialComponentProps = /** @type {const} */ ({
  instanceRH: "instanceRefHolder",
  nodeRH: "nodeRefHolder"
})

const EventAttr = /** @type {const} */ ({
  startString: "on",
  minLength: 5,
  captureEnd: "Capture"
})

// eslint-disable-next-line no-underscore-dangle
const nspace = (() => {
  const registered = /** @type {[branded: string, real: string][]} */ ([])
  /**
   * Since unlike react, jsx is converted directly into the appropriate element,
   * we rely on this function to tell the jsx runtime which namespace to use to
   * create elements. For example, <a> can HTMLAnchor or SVGAElement. By
   * specifying the appropriate NS e.g at `<svg xmlns={nspace(__SVG_NAMESPACE__)}>`,
   * the runtime can create the appropriate object.
   *
   * @param {string} namespace
   */
  const useNS = (namespace) => {
    const branded = `${namespace}::${uniqueId()}`
    registered.push([branded, namespace])
    return branded
  }

  /**
   * Returns the appropriate namespace to use based on registered namespaces.
   * @param {NormalizedElementProps} elementProps
   */
  const mutateNS = (elementProps) => {
    const nsprop = elementProps[SpecialIntrinsicProps.namespace]
    const nextNS = registered[registered.length - 1]
    if (typeof nsprop !== "string") return nextNS ? nextNS[1] : null
    if (!nextNS) return nsprop

    const [brandedNS, realNS] = nextNS
    if (nsprop !== brandedNS) return nsprop // nsprop is not branded
    registered.pop() // nsprop is branded, current element is namespace root
    return realNS
  }

  /**
   * @param {NormalizedElementProps} elementProps
   * @param {string | null} derivedNS
   */
  const nsAttrFor = (elementProps, derivedNS) => {
    const nsprop = elementProps[SpecialIntrinsicProps.namespace]
    if (typeof nsprop !== "string" || derivedNS === null) return null
    if (nsprop === derivedNS) return nsprop // `nsprop` is not branded
    return derivedNS // `nsprop` is branded
  }

  return { use: useNS, mutate: mutateNS, attrFor: nsAttrFor }
})()

/**
 * @param {NormalizedElementProps} elementProps
 * @param {Element} element
 */
function assignIntrinsicElementRef(elementProps, element) {
  const interfaceRH = elementProps[SpecialIntrinsicProps.interfaceRH]
  const nodeRH = elementProps[SpecialIntrinsicProps.nodeRH]
  if (interfaceRH !== undefined && interfaceRH !== null) {
    if (!isRH(interfaceRH)) {
      throw new Error("Invalid interface ref holder")
    }
    // @ts-expect-error
    interfaceRH.ref = element
  }

  if (nodeRH !== undefined && nodeRH !== null) {
    if (!isRH(nodeRH)) {
      throw new Error("Invalid node ref holder")
    }
    // @ts-expect-error
    nodeRH.ref = element
  }
}

/**
 * Returns `true` if the attribute is of the form `on[A-Z]...`. e.g. `onClick`
 *
 * @param {any} attribute
 * @returns {attribute is `on${string}`}
 */
function isEventAttribute(attribute) {
  if (typeof attribute !== "string") return false
  if (!attribute.startsWith(EventAttr.startString)) return false
  if (attribute.length < EventAttr.minLength) return false
  if (!/[A-Z]/.test(attribute[2] ?? "")) return false // Third letter is not uppercase
  return true
}

/**
 * @param {string} attribute
 * @returns {[string, { capture: boolean }]}
 */
function getEventDetails(attribute) {
  const withoutOn = attribute.substring(2)
  const { captureEnd } = EventAttr
  if (!attribute.endsWith(captureEnd)) {
    return [withoutOn.toLowerCase(), { capture: false }]
  }

  const name = withoutOn.substring(0, withoutOn.length - captureEnd.length)
  return [name.toLowerCase(), { capture: true }]
}

/**
 * @param {Element} element
 * @param {NormalizedElementProps} props
 * @param {string | null} derivedNS
 */
function assignIntrinsicElementAttrs(element, props, derivedNS) {
  const nsAttr = nspace.attrFor(props, derivedNS)
  const s = SpecialIntrinsicProps
  const attrProps = { ...props }
  ;[s.namespace, s.interfaceRH, s.nodeRH].forEach((name) => {
    if (name === s.namespace && nsAttr !== null) {
      attrProps[s.namespace] = nsAttr
      return
    }
    delete attrProps[name]
  })

  const propertyAPIAttrSet = new Set(IntrinsicElementPropertyAPIOnlyAttrs)
  Object.entries(attrProps).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number") {
      if (propertyAPIAttrSet.has(key)) {
        element[key] = value // eslint-disable-line no-param-reassign
      } else {
        element.setAttribute(key, String(value))
      }
    } else if (typeof value === "boolean") {
      if (value === true) element.setAttribute(key, key)
    } else if (typeof value === "function") {
      if (isEventAttribute(key)) {
        const [eventName, eventOptions] = getEventDetails(key)
        element.addEventListener(
          eventName,
          /** @type {() => void} */ (value),
          eventOptions
        )
      } else {
        throw new Error(`Unexpected function prop for key: ${key}`)
      }
    } else if (value !== null && value !== undefined) {
      throw new Error(
        `Unexpected prop '${key}' with value: \n ${String(value)}`
      )
    }
  })
}

/**
 * @param {JSXIntrinsicElementType} tagName
 * @param {NormalizedElementProps} props
 * @param {ElementChildren} children
 */
function createInstrinsicElement(tagName, props, children) {
  const namespace = nspace.mutate(props)
  /** @type {Element | null} */
  let element = null

  if (namespace !== null) {
    element = document.createElementNS(namespace, tagName)
  } else {
    element = document.createElement(tagName)
    if (element instanceof HTMLUnknownElement) {
      element = document.createElementNS(Namespaces.svg, tagName)
      if (element.constructor === SVGElement) {
        // SVGElement is generic so element is not svg element
        element = document.createElementNS(Namespaces.mathml, tagName)
      }
    }
  }

  assignIntrinsicElementRef(props, element)
  assignIntrinsicElementAttrs(element, props, namespace)
  if (children !== undefined) element.appendChild(resolveToNode(children))
  return element
}

/**
 * @param {NormalizedElementProps} elementProps
 * @param {Node} node
 * @param {Component} [instance]
 */
function assignComponentElementRef(elementProps, node, instance) {
  const instanceRH = elementProps[SpecialComponentProps.instanceRH]
  const nodeRH = elementProps[SpecialComponentProps.nodeRH]

  if (instance) {
    if (instanceRH !== undefined && instanceRH !== null) {
      if (!isRH(instanceRH)) throw new Error("Invalid instance ref holder")
      // @ts-expect-error
      instanceRH.ref = instance
    }
  }

  if (nodeRH !== undefined && nodeRH !== null) {
    if (!isRH(nodeRH)) {
      throw new Error("Invalid node ref holder")
    }
    // @ts-expect-error
    nodeRH.ref = node
  }
}

/**
 * @param {NormalizedElementProps} props
 * @param {ElementChildren} children
 * @returns {ComponentProps}
 */
function getComponentExecutionProps(props, children) {
  const componentProps = { ...props }
  const p = SpecialComponentProps
  ;[p.instanceRH, p.nodeRH].forEach((name) => {
    delete componentProps[name]
  })
  if (children !== undefined) componentProps.children = children
  return componentProps
}

/**
 * @param {JSXFunctionElementType | JSXClassElementType} func
 * @param {NormalizedElementProps} props
 * @param {ElementChildren} children
 */
function createComponentElement(func, props, children) {
  const executionProps = getComponentExecutionProps(props, children)
  let node = /** @type {Node | null} */ (null)
  let instance = /** @type {Component | null} */ (null)

  try {
    node = resolveToNode(
      /** @type {JSXFunctionElementType} */ (func).call(null, executionProps)
    )
  } catch {
    // Component is class if error is thrown
    const C = /** @type {JSXClassElementType} */ (func)
    instance = new C(executionProps)
    node = instance.rootNode()
  }

  assignComponentElementRef(props, node, instance ?? undefined)
  return node
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

  throw new TypeError("`type` must be a string or a function")
}

/**
 * @param {Object} param0
 * @param {any} param0.children
 */
function Fragment({ children }) {
  return resolveToNode(children)
}

const ns = {
  /** @param {string} namespace */
  url: (namespace) => nspace.use(namespace),
  svg: () => nspace.use(Namespaces.svg),
  mathml: () => nspace.use(Namespaces.mathml)
}

export { jsx, jsx as jsxs, Fragment, ns }
