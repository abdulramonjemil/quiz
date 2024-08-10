/**
 * @import { TupleSlice } from "./types"
 */

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

/**
 * @param {boolean} condition
 * @param {string} desc
 * @returns {asserts condition}
 */
export function assertCondition(condition, desc) {
  if (condition !== true) {
    throw new Error(`Expected '${desc}' to be true`)
  }
}

/** @type {<T>(value: T, desc: string) => asserts value is Exclude<T, undefined | null>} */
export const assertIsDefined = (value, desc) => {
  if (value === undefined || value === null)
    throw new Error(`Expected '${desc}' to be defined, got '${String(value)}'`)
}

/**
 * @template {new (...params: any[]) => any} Constructor
 * @param {any} value
 * @param {Constructor} constructor
 * @returns {asserts value is InstanceType<Constructor>}
 */
export function assertIsInstance(value, constructor) {
  if (!(value instanceof constructor)) {
    throw new Error(
      `Expected ${value} to be an instance of '${constructor.name}'`
    )
  }
}

/**
 * @param {Function} classRef
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

/**
 * @template {any} ArrayItem
 *
 * @param {Object} param0
 * @param {ArrayItem[]} param0.array
 * @param {number} param0.startIndex
 * @param {(item: ArrayItem) => boolean} param0.predicate
 * @param {boolean} param0.backward
 * @param {boolean} param0.wrap
 */
export function find({ array, startIndex, wrap, backward, predicate }) {
  const arr = backward ? [...array].reverse() : array
  const start = backward ? array.length - startIndex - 1 : startIndex

  // Iterate from startIndex to the end of the array
  for (let i = start; i < arr.length; i += 1) {
    const item = /** @type {ArrayItem} */ (arr[i])
    if (predicate(item) === true) return arr[i]
  }

  if (wrap) {
    for (let i = 0; i < start; i += 1) {
      const item = /** @type {ArrayItem} */ (arr[i])
      if (predicate(item) === true) return arr[i]
    }
  }

  return null
}

/**
 * @template {any} ArrayItem
 *
 * @param {ArrayItem[]} array
 * @param {(item: ArrayItem) => boolean} predicate
 * @param {number} startIndex
 */
export const circularlyFindForward = (array, predicate, startIndex = 0) =>
  find({ array, predicate, startIndex, wrap: true, backward: false })

/**
 * @template {any} ArrayItem
 *
 * @param {ArrayItem[]} array
 * @param {(item: ArrayItem) => boolean} predicate
 * @param {number} startIndex
 */
export const circularlyFindBackward = (
  array,
  predicate,
  startIndex = array.length - 1
) => find({ array, predicate, startIndex, wrap: true, backward: true })

/**
 * @template {any} ArrayItem
 *
 * @param {ArrayItem[]} array
 * @param {(item: ArrayItem) => boolean} predicate
 * @param {number} startIndex
 */
export const findFirst = (array, predicate, startIndex = 0) =>
  find({ array, predicate, startIndex, wrap: false, backward: false })

/**
 * @template {any} ArrayItem
 *
 * @param {ArrayItem[]} array
 * @param {(item: ArrayItem) => boolean} predicate
 * @param {number} highestIndex
 */
export const findLast = (array, predicate, highestIndex = array.length - 1) => {
  const result = find({
    array,
    predicate,
    startIndex: highestIndex,
    wrap: false,
    backward: true
  })
  return result
}

/**
 * @template T
 * @template {any[]} P
 * @template {TupleSlice<P>} A
 * @template R
 * @param {(this: T, ...params: P) => R} func
 * @param {() => [T, ...A]} getParams
 */
export function bindReturn(func, getParams) {
  /** @param {P extends [...A, ...infer B] ? B : []} params */
  // @ts-expect-error
  return (...params) => func.call(...getParams(), ...params)
}

/**
 * Checks whether a class extends another class (directly or
 * indirectly). For example, if class 'C' extends class 'B', and class 'B'
 * extends class 'A', this function will return true when passed 'C' and 'A'
 * (in that order).
 *
 * @template {new (...args: any[]) => any} T
 * @param {any} value
 * @param {T} parentClass
 * @returns {value is new (...args: any[]) => InstanceType<T>}
 */
export function isExtender(value, parentClass) {
  if (typeof value !== "function") return false
  if (
    typeof value.prototype !== "object" ||
    value.prototype === null ||
    typeof parentClass.prototype !== "object" ||
    parentClass.prototype === null
  ) {
    return false
  }

  let mediatorClass = value
  while (mediatorClass !== null) {
    const protoOfMediatorClass = Object.getPrototypeOf(mediatorClass)
    const protoOfMediatorClassPrototype = Object.getPrototypeOf(
      mediatorClass.prototype
    )

    if (protoOfMediatorClassPrototype !== protoOfMediatorClass.prototype) {
      return false
    }

    if (
      protoOfMediatorClass === parentClass &&
      protoOfMediatorClassPrototype === parentClass.prototype
    ) {
      return true
    }

    mediatorClass = protoOfMediatorClass
  }

  return false
}
