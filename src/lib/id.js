export function uniqueId() {
  const timeStamp = String(performance.now()).replace(".", "-")
  const randomNumberWithoutDot = String(Math.random()).slice(2)
  const finalUniqueId = `uuid__${timeStamp}-${randomNumberWithoutDot}`
  return finalUniqueId
}
