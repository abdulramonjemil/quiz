const PROP_FOR_ELEMENT_OBJECT = "ref"
const PROP_FOR_CLASS_INSTANCE = "instanceRef"

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
    if (key === PROP_FOR_ELEMENT_OBJECT && typeof value === "object") {
      const providedRef = value
      providedRef.current = element
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
    const { [PROP_FOR_CLASS_INSTANCE]: providedInstanceRef, ...otherProps } =
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

function createFragment(props, ...children) {
  if (children.length === 1) return children[0]
  return children
}

const Fragment = createFragment
const jsx = resolveJSXElement
const jsxs = resolveJSXElement

export default { Fragment, jsx, jsxs }
