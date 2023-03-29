import { resolveToNode } from "./jsx-runtime"

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

export function isFilledString(value) {
  return typeof value === "string" && value !== ""
}

export function uniqueId() {
  const timeStamp = String(performance.now()).replace(".", "-")
  const randomNumberWithoutDot = String(Math.random()).slice(2)
  const finalUniqueId = `uuid__${timeStamp}-${randomNumberWithoutDot}`
  return finalUniqueId
}

export function webStorageIsAvailable(type) {
  if (type !== "localStorage" && type !== "sessionStorage")
    throw new TypeError(`Unknown web storage type: ${type}`)

  try {
    const storage = window[type]
    if (!(storage instanceof Storage)) return false
    const testValueForStorage = `__${uniqueId()}__`
    storage.setItem(testValueForStorage, testValueForStorage)
    storage.removeItem(testValueForStorage)
    return true
  } catch (error) {
    return false
  }
}
