/**
 * @param {string} value
 * @returns {{ success: true, value: unknown } | { success: false }}
 */
export function tryJSONParse(value) {
  try {
    const parseResult = JSON.parse(value)
    return { success: true, value: parseResult }
  } catch {
    return { success: false }
  }
}
