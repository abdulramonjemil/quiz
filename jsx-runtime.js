import Component from "./component"

const PROP_FOR_ELEMENT_REF = "elementRef"
const PROP_FOR_INSTANCE_REF = "instanceRef"

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
      if (!Component.isElementRef(value))
        throw new Error("Invalid elementRef object")
      const providedElementRef = value
      providedElementRef.current = element
    } else if (typeof value === "string" && !MUST_CHAIN_HTML_KEYS.includes(key))
      element.setAttribute(key, value)
    else if (typeof value !== "undefined") element[key] = value
  })

  if (children) appendJSXChildToParent(element, children)
  return element
}

function resolveTypeAsComponent(func, props, children) {
  try {
    return func(props, children) // Will throw an error if it is a class
  } catch (error) {
    const DefinedComponent = func
    const { [PROP_FOR_INSTANCE_REF]: providedInstanceRef, ...propsToPass } =
      props
    const componentInstance = new DefinedComponent(propsToPass, children)

    if (Object.prototype.hasOwnProperty.call(props, PROP_FOR_INSTANCE_REF)) {
      if (!Component.isInstanceRef(providedInstanceRef))
        throw new Error("Invalid instanceRef object")
      else providedInstanceRef.current = componentInstance
    }
    return componentInstance.componentElement
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

function resolveFragment(props, children) {
  return children
}

const Fragment = resolveFragment
const jsx = resolveJSXElement

export { Fragment, jsx, jsx as jsxs }
