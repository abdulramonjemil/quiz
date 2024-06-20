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
