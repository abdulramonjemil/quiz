import { resolveToNode } from "@/jsx/base"
import { isRH } from "@/jsx/ref"
import {
  __forbiddenPopContextDataFromStack__,
  isContextData
} from "@/jsx/context"
import { nsCtx } from "./context"

/**
 * @typedef {import("@/jsx/base").JSXIntrinsicElementType} JSXIntrinsicElementType
 * @typedef {import("./base").NormalizedElementProps} NormalizedElementProps
 * @typedef {import("./base").ElementChildren} ElementChildren
 */

/** Only usable via `element.property` */
const IntrinsicElementPropertyAPIOnlyAttrs = ["className", "htmlFor"]

export const SpecialIntrinsicProps = /** @type {const} */ ({
  interfaceRH: "refHolder",
  nodeRH: "nodeRefHolder",
  namespace: "xmlns"
})

const EventAttr = /** @type {const} */ ({
  startString: "on",
  minLength: 5,
  captureEnd: "Capture"
})

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
    // @ts-expect-error -- Must be done to populate ref value
    interfaceRH.ref = element
  }

  if (nodeRH !== undefined && nodeRH !== null) {
    if (!isRH(nodeRH)) {
      throw new Error("Invalid node ref holder")
    }
    // @ts-expect-error -- Must be done to populate ref value
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
 */
function assignIntrinsicElementAttrs(element, props) {
  const s = SpecialIntrinsicProps
  const attrProps = { ...props }

  ;[s.namespace, s.interfaceRH, s.nodeRH].forEach((name) => {
    const value = attrProps[name]
    if (name === s.namespace && isContextData(value)) {
      attrProps[s.namespace] = nsCtx.value()
      // The current element is at the root element where it is placed
      __forbiddenPopContextDataFromStack__(value)
      return
    }
    delete attrProps[name]
  })

  const propertyAPIAttrSet = new Set(IntrinsicElementPropertyAPIOnlyAttrs)
  Object.entries(attrProps).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number") {
      if (propertyAPIAttrSet.has(key)) {
        // @ts-expect-error -- Required since key is not a literal string type
        element[key] = value
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
export function createInstrinsicElement(tagName, props, children) {
  const namespace = nsCtx.value()
  /** @type {Element | null} */
  const element = document.createElementNS(namespace, tagName)

  assignIntrinsicElementRef(props, element)
  assignIntrinsicElementAttrs(element, props)
  if (children !== undefined) element.appendChild(resolveToNode(children))
  return element
}
