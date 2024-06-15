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
