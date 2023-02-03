function isObject(value) {
  return (
    typeof value === "function" || (typeof value === "object" && value !== null)
  )
}

/**
 * Checks whether a class extends another class (directly or
 * indirectly). For example, if class 'C' extends class 'B', and class 'B'
 * extends class 'A', this function will return true when passed 'C' and 'A'
 * (in that order).
 */
export default function isExtender(firstClass, secondClass) {
  if (typeof firstClass !== "function")
    throw new TypeError(`${firstClass} is not a class`)

  if (typeof secondClass !== "function")
    throw new TypeError(`${secondClass} is not a class`)

  if (!isObject(firstClass.prototype) || !isObject(secondClass.prototype))
    return false

  let mediatorClass = firstClass
  while (mediatorClass !== null) {
    const protoOfMediatorClass = Object.getPrototypeOf(mediatorClass)
    const protoOfMediatorClassPrototype = Object.getPrototypeOf(
      mediatorClass.prototype
    )
    if (protoOfMediatorClassPrototype !== protoOfMediatorClass.prototype)
      return false

    if (
      protoOfMediatorClass === secondClass &&
      protoOfMediatorClassPrototype === secondClass.prototype
    )
      return true

    mediatorClass = protoOfMediatorClass
  }
  return false
}
