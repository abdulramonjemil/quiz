import Component, { isElementRefHolder, isInstanceRefHolder } from "./component"

const PROP_FOR_ELEMENT_REF = "elementRef"
const PROP_FOR_INSTANCE_REF_OBJECT = "instanceRef"
const REF_OBJECT_MAIN_KEY = "ref"
const MUST_CHAIN_HTML_KEYS = ["className", "htmlFor", "innerHTML"]

function appendJSXChildToParent(parent, child) {
  if (Array.isArray(child))
    child.forEach((innerChild) => appendJSXChildToParent(parent, innerChild))
  else if (typeof child !== "boolean" && child !== null && child !== undefined)
    parent.appendChild(
      child instanceof HTMLElement
        ? child
        : document.createTextNode(String(child))
    )
}

function createHTMLElement(tagName, props, children) {
  const element = document.createElement(tagName)
  Object.entries(props).forEach(([key, value]) => {
    if (key === PROP_FOR_ELEMENT_REF) {
      if (!isElementRefHolder(value))
        throw new Error("Invalid elementRef object")
      const providedElementRefHolder = value
      providedElementRefHolder[REF_OBJECT_MAIN_KEY] = element
    } else if (typeof value === "string" && !MUST_CHAIN_HTML_KEYS.includes(key))
      element.setAttribute(key, value)
    else if (typeof value !== "undefined") element[key] = value
  })

  if (children !== undefined) appendJSXChildToParent(element, children)
  return element
}

function resolveTypeAsComponent(func, props, children) {
  const {
    [PROP_FOR_INSTANCE_REF_OBJECT]: providedInstanceRefHolder,
    ...propsToPass
  } = props
  const instanceRefIsRequested = Object.prototype.hasOwnProperty.call(
    props,
    PROP_FOR_INSTANCE_REF_OBJECT
  )

  try {
    // Will throw an error if it is a class
    const componentComposedNode = func(propsToPass, children)
    const componentIsFunction = true // Error isn't thrown by calling func()
    if (instanceRefIsRequested && componentIsFunction)
      throw new Error(
        "'instanceRef' cannot be requested for a function component"
      )
    return componentComposedNode
  } catch (error) {
    const DefinedComponent = func
    const component = new DefinedComponent(propsToPass, children)
    if (!(component instanceof Component))
      throw new Error(`${DefinedComponent.name} does not extend 'Component'`)

    if (instanceRefIsRequested) {
      if (!isInstanceRefHolder(providedInstanceRefHolder))
        throw new Error("Invalid instanceRef object")
      else providedInstanceRefHolder[REF_OBJECT_MAIN_KEY] = component
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

function resolveFragment({ children }) {
  return children
}

export {
  resolveFragment as Fragment,
  resolveJSXElement as jsx,
  resolveJSXElement as jsxs
}