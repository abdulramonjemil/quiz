import { resolveToNode } from "../lib/dom"
import Component, { isElementRefHolder, isInstanceRefHolder } from "./component"

const PROP_FOR_REF_HOLDER = "refHolder"
const MUST_CHAIN_HTML_KEYS = ["className", "htmlFor", "innerHTML"]

const END_OF_CAPTURE_EVENT_ATTRIBUTE = "Capture"
const MINIMUM_EVENT_ATTRIBUTE_LENGTH = 5
const START_OF_EVENT_ATTRIBUTES = "on"

const SEPARATOR_IN_REGISTERED_NAMESPACE = "@&#%"
const REGISTERED_NAMESPACES = []

const MATHML_NAMESPACE_URI = "http://www.w3.org/1998/Math/MathML"
const SVG_NAMESPACE_URI = "http://www.w3.org/2000/svg"

const XML_NAMESPACE_PROP = "xmlns"

function registerNamespace(namespaceURI) {
  if (typeof namespaceURI !== "string" || namespaceURI === "")
    throw new TypeError("namespaceURI must be a string")

  // Add random number with separator to prevent hardcoding
  const namespaceToRegister = `${Math.random()}${SEPARATOR_IN_REGISTERED_NAMESPACE}${namespaceURI}`
  REGISTERED_NAMESPACES.push(namespaceToRegister)
  return namespaceToRegister
}

function retrieveRealNSFromRegistered(namespace) {
  /* eslint-disable-next-line no-unused-vars */
  const [randomNumber, realNamespace] = namespace.split(
    SEPARATOR_IN_REGISTERED_NAMESPACE
  )
  return realNamespace
}

function isEventAttribute(attribute) {
  if (typeof attribute !== "string") return false
  if (!attribute.startsWith(START_OF_EVENT_ATTRIBUTES)) return false
  if (attribute.length < MINIMUM_EVENT_ATTRIBUTE_LENGTH) return false
  if (!/[A-Z]/.test(attribute[2])) return false // Third letter is uppercase
  return true
}

function getEventDetails(attribute) {
  if (typeof attribute !== "string")
    throw new TypeError("'attribute' must be a string")
  const attributeWithoutOn = attribute.substring(2)

  if (attributeWithoutOn.endsWith(END_OF_CAPTURE_EVENT_ATTRIBUTE))
    return [
      attributeWithoutOn
        .substring(
          0,
          attributeWithoutOn.length - END_OF_CAPTURE_EVENT_ATTRIBUTE.length
        )
        .toLowerCase(),
      { capture: true }
    ]

  return [attributeWithoutOn.toLowerCase(), { capture: false }]
}

function assignAttributesFromProps(element, props) {
  Object.entries(props).forEach(([key, value]) => {
    if (typeof value === "string" || typeof value === "number")
      if (MUST_CHAIN_HTML_KEYS.includes(key))
        /* eslint-disable-next-line no-param-reassign */
        element[key] = value
      else element.setAttribute(key, value)
    else if (typeof value === "boolean") {
      if (value === true) element.setAttribute(key, key)
    } else if (typeof value === "function") {
      if (isEventAttribute(key)) {
        const [eventName, eventOptions] = getEventDetails(key)
        element.addEventListener(eventName, value, eventOptions)
      } else {
        /* eslint-disable-next-line no-param-reassign */
        element[key] = value
      }
    }
  })
}

function createElement(tagName, props, children) {
  const {
    [XML_NAMESPACE_PROP]: elementNamespace,
    [PROP_FOR_REF_HOLDER]: providedElementRefHolder,
    ...propsToPass
  } = props

  const registeredNamespaceToUse =
    REGISTERED_NAMESPACES[REGISTERED_NAMESPACES.length - 1]
  let element = null

  if (typeof elementNamespace === "string" && elementNamespace !== "") {
    if (elementNamespace !== registeredNamespaceToUse) {
      element = document.createElementNS(elementNamespace, tagName)
      propsToPass[XML_NAMESPACE_PROP] = elementNamespace
    } else {
      REGISTERED_NAMESPACES.pop()
      const realNamespaceToUse = retrieveRealNSFromRegistered(
        registeredNamespaceToUse
      )
      element = document.createElementNS(realNamespaceToUse, tagName)
      propsToPass[XML_NAMESPACE_PROP] = realNamespaceToUse
    }
  } else if (registeredNamespaceToUse !== undefined) {
    const realNamespaceToUse = retrieveRealNSFromRegistered(
      registeredNamespaceToUse
    )
    element = document.createElementNS(realNamespaceToUse, tagName)
  } else {
    element = document.createElement(tagName)
    if (element instanceof HTMLUnknownElement) {
      // The element is not identified as an HTML element
      element = document.createElementNS(SVG_NAMESPACE_URI, tagName)
      if (element.constructor === SVGElement)
        // The element is not identified as an SVG element since SVGElement is generic
        element = document.createElementNS(MATHML_NAMESPACE_URI, tagName)
    }
  }

  if (providedElementRefHolder !== undefined) {
    if (!isElementRefHolder(providedElementRefHolder))
      throw new TypeError("Invalid element ref holder")
    providedElementRefHolder.ref = element
  }

  assignAttributesFromProps(element, propsToPass)
  if (children !== undefined) element.appendChild(resolveToNode(children))
  return element
}

function resolveTypeAsComponent(func, props, children) {
  const { [PROP_FOR_REF_HOLDER]: providedInstanceRefHolder, ...propsToPass } =
    props

  const instanceRefIsRequested = providedInstanceRefHolder !== undefined
  let componentIsFunction = false

  try {
    // Will throw an error if it is a class
    const componentComposedNode = func(propsToPass, children)
    componentIsFunction = true // Error isn't thrown by calling func()
    if (instanceRefIsRequested && componentIsFunction)
      throw new Error(
        `'instance ref' cannot be requested for a function component: '${func.name}'`
      )
    return componentComposedNode
  } catch (error) {
    if (componentIsFunction) throw error
    const DefinedComponent = func

    const component = new DefinedComponent(propsToPass, children)
    if (!(component instanceof Component))
      throw new Error(`${DefinedComponent.name} does not extend 'Component'`)

    if (instanceRefIsRequested) {
      if (!isInstanceRefHolder(providedInstanceRefHolder))
        throw new Error("Invalid instance ref holder")
      else providedInstanceRefHolder.ref = component
    }
    return component.composedNode
  }
}

/**
 * Pass the 'key' as a prop directly to the resolver of the JSX element.
 * Also pass 'children' as a separate parameter to it instead of as a prop.
 */
function resolveJSXElement(type, { children, ...otherProps }, key) {
  const props = { ...otherProps, key }
  if (typeof type === "string") return createElement(type, props, children)
  if (typeof type === "function")
    return resolveTypeAsComponent(type, props, children)
  throw new TypeError("`type` must be a string or a function")
}

function resolveFragment(_, children) {
  return children
}

export {
  registerNamespace as ns,
  resolveFragment as Fragment,
  resolveJSXElement as jsx,
  resolveJSXElement as jsxs
}
