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
