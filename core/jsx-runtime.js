/* eslint-disable-next-line import/no-cycle */
import Component, { isElementRefHolder, isInstanceRefHolder } from "./component"

const PROP_FOR_REF_HOLDER = "refHolder"
const MINIMUM_EVENT_ATTRIBUTE_LENGTH = 5
const MUST_CHAIN_HTML_KEYS = ["className", "htmlFor", "innerHTML"]
const START_OF_EVENT_ATTRIBUTES = "on"

function resolveToNode(value) {
  if (value instanceof Node) return value
  if (typeof value === "boolean" || value === null || value === undefined)
    return document.createTextNode("")
  if (Array.isArray(value))
    return value.reduce((fragment, currentItem) => {
      fragment.append(resolveToNode(currentItem))
      return fragment
    }, document.createDocumentFragment())
  return document.createTextNode(String(value))
}

function isEventAttribute(attribute) {
  if (typeof attribute !== "string") return false
  if (!attribute.startsWith(START_OF_EVENT_ATTRIBUTES)) return false
  if (attribute.length < MINIMUM_EVENT_ATTRIBUTE_LENGTH) return false
  if (!/[A-Z]/.test(attribute[2])) return false // Third letter is uppercase
  return true
}

function createHTMLElement(tagName, props, children) {
  const element = document.createElement(tagName)
  Object.entries(props).forEach(([key, value]) => {
    if (key === PROP_FOR_REF_HOLDER) {
      if (!isElementRefHolder(value))
        throw new Error("Invalid element ref holder")
      const providedElementRefHolder = value
      providedElementRefHolder.ref = element
    } else if (typeof value === "string" && !MUST_CHAIN_HTML_KEYS.includes(key))
      element.setAttribute(key, value)
    else if (isEventAttribute(key) && typeof value === "function")
      element[key.toLocaleLowerCase] = value
    else if (typeof value !== "undefined") element[key] = value
  })

  if (children !== undefined) element.appendChild(resolveToNode(children))
  return element
}

function resolveTypeAsComponent(func, props, children) {
  const { [PROP_FOR_REF_HOLDER]: providedInstanceRefHolder, ...propsToPass } =
    props
  const instanceRefIsRequested = Object.prototype.hasOwnProperty.call(
    props,
    PROP_FOR_REF_HOLDER
  )

  try {
    // Will throw an error if it is a class
    const componentComposedNode = func(propsToPass, children)
    const componentIsFunction = true // Error isn't thrown by calling func()
    if (instanceRefIsRequested && componentIsFunction)
      throw new Error(
        "'instance ref' cannot be requested for a function component"
      )
    return componentComposedNode
  } catch (error) {
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
  if (typeof type === "string") return createHTMLElement(type, props, children)
  if (typeof type === "function")
    return resolveTypeAsComponent(type, props, children)
  throw new TypeError("`type` must be a string or a function")
}

function resolveFragment(_, children) {
  return children
}

export {
  resolveFragment as Fragment,
  resolveJSXElement as jsx,
  resolveJSXElement as jsxs,
  resolveToNode
}
