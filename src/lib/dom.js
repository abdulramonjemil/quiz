export function resolveToNode(value) {
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

export function escapeHTMLContent(unsafeText) {
  const div = document.createElement("div")
  div.innerText = String(unsafeText)
  return div.innerHTML
}

/**
 * @returns {DocumentFragment}
 */
export function htmlStringToFragment(htmlString) {
  if (typeof htmlString !== "string")
    throw new TypeError("'htmlString' is not a string")

  const div = document.createElement("div")
  div.innerHTML = htmlString
  return resolveToNode(Array.from(div.childNodes))
}

/**
 * Sets HTML attribute on element preventing resetting of already set values.
 *
 * @type {(
 *   element: HTMLElement,
 *   attributeName: string,
 *   attributeValue: string | boolean
 * ) => void}
 */
export const setElementHTMLAttribute = (
  element,
  attributeName,
  attributeValue
) => {
  if (typeof attributeValue === "string") {
    if (element.getAttribute(attributeName) === attributeValue) return
    element.setAttribute(attributeName, attributeValue)
  } else if (typeof attributeValue === "boolean") {
    if (element.hasAttribute(attributeName) === attributeValue) return
    if (attributeValue === true) element.setAttribute(attributeName, "")
    else element.removeAttribute(attributeName)
  }
}
