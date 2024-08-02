export function uniqueId() {
  const timeStamp = performance.now().toString(36).replace(".", "-")
  const randomNumberWithoutDot = Math.random().toString(36).slice(2)
  const finalUniqueId = `:id:-${timeStamp}:-${randomNumberWithoutDot}`
  return finalUniqueId
}
