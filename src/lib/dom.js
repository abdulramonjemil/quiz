export function escapeHTMLContent(unsafeText) {
  const div = document.createElement("div")
  div.innerText = String(unsafeText)
  return div.innerHTML
}

/**
 * Creates CSS class string from different structures
 *
 * @typedef {string | null | undefined | ConditionalClassValue} ClassValue
 * @typedef {UnaryConditionalClassValue | BinaryConditionalClassValue} ConditionalClassValue
 * @typedef {[boolean, ClassValue]} UnaryConditionalClassValue
 * @typedef {[boolean, ClassValue, ClassValue]} BinaryConditionalClassValue
 * @typedef {(ClassValue | ClassValue[])[]} ClassConfig
 *
 * @param {ClassConfig} config
 * @returns {string}
 */
export function cn(...config) {
  /** @type {(value: any[]) => value is ClassValue & any[]} */
  const isClassValueArray = (value) => typeof value[0] === "boolean"
  const mapped = config.map((c) => {
    if (c === null || c === undefined) return ""
    if (typeof c === "string") return c
    if (isClassValueArray(c)) {
      if (c.length === 2) return c[0] ? cn(c[1]) : ""
      return c[0] ? cn(c[1]) : cn(c[2])
    }
    return cn(...c)
  })

  // Split all space-containing class strings including those from recursive calls
  const distinctSet = new Set(mapped.join(" ").split(/ +/))
  return Array.from(distinctSet).join(" ").trim()
}

/**
 * @param {HTMLElement} element
 * @param {string} classString
 */
export function hasClassNames(element, classString) {
  const set = /** @type {Set<string} */ (new Set(element.classList))
  return classString.split(/ +/).every((name) => {
    if (name === "") return true
    return set.has(name)
  })
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
