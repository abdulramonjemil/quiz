/**
 * @param {new (...args: any[]) => object} classRef
 * @param {string} methodName
 */
export function throwAbsentMethodError(classRef, methodName) {
  throw new Error(`Expected '${classRef.name}' to implement '${methodName}()'`)
}

/**
 * @param {new (...args: any[]) => object} parentClass
 * @param {new (...args: any[]) => object} childClass
 * @param {string[]} methods
 */
export function assertOverwrittenParentMethods(
  parentClass,
  childClass,
  methods
) {
  methods.forEach((method) => {
    if (childClass.prototype[method] === parentClass.prototype[method]) {
      throwAbsentMethodError(childClass, method)
    }
  })
}
