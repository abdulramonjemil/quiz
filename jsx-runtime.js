const PROP_FOR_ELEMENT_REF = "elementRef"
const PROP_FOR_INSTANCE_REF = "instanceRef"

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
    if (key === PROP_FOR_ELEMENT_REF && typeof value === "object") {
      const providedElementRef = value
      providedElementRef.current = element
    } else {
      if (typeof value === "string") element.setAttribute(key, value)
      if (typeof value !== "undefined") element[key] = value
    }
  })

  if (children) appendJSXChildToParent(element, children)
  return element
}

function resolveTypeAsComponent(func, props, children) {
  try {
    // Will throw an error if it is a class
    return func(props, children)
  } catch (error) {
    const DefinedComponent = func
    const { [PROP_FOR_INSTANCE_REF]: providedInstanceRef, ...otherProps } =
      props
    const componentInstance = new DefinedComponent(otherProps, children)
    if (typeof providedInstanceRef === "object")
      providedInstanceRef.current = componentInstance
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
