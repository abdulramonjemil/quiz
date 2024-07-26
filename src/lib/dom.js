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
  const fragment = new DocumentFragment()
  fragment.append(...div.childNodes)
  return fragment
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

/**
 * Focus helpers
 */

/**
 * @type {(
 *   element: HTMLElement,
 *   onlyIfTabbable: boolean,
 *   options?: FocusOptions | undefined
 * ) => boolean}
 */
export const attemptFocus = (element, onlyIfTabbable, options) => {
  if (document.activeElement === element) return true
  if (onlyIfTabbable && element.tabIndex < 0) return false

  try {
    element.focus(options)
  } catch {
    return false
  }

  return document.activeElement === element
}

/**
 * @type {(
 *   element: HTMLElement,
 *   options?: FocusOptions | undefined
 * ) => boolean}
 */
export const attemptElementFocus = (element, options) =>
  attemptFocus(element, false, options)

/**
 * @type {(
 *   element: HTMLElement,
 *   options?: FocusOptions | undefined
 * ) => boolean}
 */
export const attemptTabbableFocus = (element, options) =>
  attemptFocus(element, true, options)
