import { resolveToNode } from "../core/jsx-runtime"

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
