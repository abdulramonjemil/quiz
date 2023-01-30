const PROP_FOR_ELEMENT_REF = "elementRef"
const PROP_FOR_INSTANCE_REF = "instanceRef"

function appendJSXChildToParent(parent, child) {
  if (Array.isArray(child))
    child.forEach((innerChild) => appendJSXChildToParent(parent, innerChild))
  else if (typeof child !== "boolean" && child !== null && child !== undefined)
    parent.appendChild(
      typeof child === "string" ? document.createTextNode(String(child)) : child
    )
}

function createHTMLElement(tag, props, children) {
  const element = document.createElement(tag)
  Object.entries(props).forEach(([key, value]) => {
    if (key === PROP_FOR_ELEMENT_REF && typeof value === "object") {
      const providedElementRef = value
      providedElementRef.current = element
    } else {
      if (typeof value === "string") element.setAttribute(key, value)
      element[key] = value
    }
  })

  children.forEach((child) => {
    appendJSXChildToParent(element, child)
  })

  return element
}

function resolveTagAsComponent(func, props, children) {
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
    return componentInstance.markup
  }
}

function resolveJSXElement(tag, props, children) {
  if (typeof tag === "string") return createHTMLElement(tag, props, children)
  if (typeof tag === "function")
    return resolveTagAsComponent(tag, props, children)
  throw new TypeError("`tag` must be a string or a function")
}

function resolveFragment(props, ...children) {
  if (children.length === 1) return children[0]
  return children
}

const Fragment = resolveFragment
const jsx = resolveJSXElement
const jsxs = resolveJSXElement

export default { Fragment, jsx, jsxs }
