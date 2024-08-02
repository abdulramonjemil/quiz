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

/** @param {string} unsafeText */
export function escapeHTMLContent(unsafeText) {
  const div = document.createElement("div")
  div.innerText = String(unsafeText)
  return div.innerHTML
}

/**
 * @typedef {string | null | undefined | ConditionalClassValue} ClassValue
 * @typedef {UnaryConditionalClassValue | BinaryConditionalClassValue} ConditionalClassValue
 * @typedef {[boolean, ClassValue]} UnaryConditionalClassValue
 * @typedef {[boolean, ClassValue, ClassValue]} BinaryConditionalClassValue
 * @typedef {(ClassValue | ClassConfig)[]} ClassConfig
 */

/**
 * Creates CSS class string from different structures
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
 * @param {ClassConfig} classes
 */
export function addClasses(element, ...classes) {
  setElementHTMLAttribute(element, "class", cn([element.className, classes]))
}

/**
 * @param {HTMLElement} element
 * @param {ClassConfig} classes
 */
export function removeClasses(element, ...classes) {
  const c = new Set(cn(element.className).split(/ +/))
  cn(classes)
    .split(/ +/)
    .forEach((e) => c.delete(e))
  setElementHTMLAttribute(element, "class", cn(Array.from(c)))
}

/**
 * @param {HTMLElement} element
 * @param {ClassConfig} classes
 */
export function hasClasses(element, ...classes) {
  const c = new Set(cn(element.className).split(/ +/))
  const t = cn(classes).split(/ +/)
  return t.every((n) => {
    if (n === "") return true
    return c.has(n)
  })
}

/**
 * @param {HTMLElement} element
 * @param {ClassConfig} classes
 */
export function toggleClasses(element, ...classes) {
  if (hasClasses(element, ...classes)) removeClasses(element, ...classes)
  else addClasses(element, ...classes)
}

/** @param {([string, string | number])[]} config  */
export function css(config) {
  const mapped = config.map((def) => `${def[0]}: ${def[1]};`)
  return mapped.join("\n")
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
