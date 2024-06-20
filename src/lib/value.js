/**
 * @template {new () => any} Constructor
 * @param {Value} value
 * @param {Constructor} constructor
 * @returns {asserts value is InstanceType<Constructor}
 */
export function assertIsInstance(value, constructor) {
  if (!(value instanceof constructor)) {
    throw new Error(
      `Expected ${value} to be an instance of '${constructor.name}'`
    )
  }
}

/**
 * @template {any} ArrayItem
 *
 * @param {Object} param0
 * @param {ArrayItem[]} param0.array
 * @param {number} param0.startIndex
 * @param {(item: ArrayItem) => boolean} param0.predicate
 * @param {boolean} param0.wrap
 */
export function findFirstMatchingItem({
  array,
  startIndex,
  predicate,
  wrap = false
}) {
  // Iterate from startIndex to the end of the array
  for (let i = startIndex; i < array.length; i += 1) {
    if (predicate(array[i]) === true) {
      return array[i]
    }
  }

  if (wrap) {
    // Iterate from the beginning of the array to the startIndex
    for (let i = 0; i < startIndex; i += 1) {
      if (predicate(array[i]) === true) {
        return array[i]
      }
    }
  }

  return null
}
