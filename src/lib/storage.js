import { uniqueId } from "./factory"

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
