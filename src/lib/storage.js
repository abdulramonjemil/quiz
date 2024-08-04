import { uniqueId } from "./factory"

/** @param {"localStorage" | "sessionStorage"} type */
export function webStorageIsAvailable(type) {
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
