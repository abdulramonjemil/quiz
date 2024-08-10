/**
 * @template {any[]} T
 * @typedef {T extends [infer First, ...infer Rest]
 *   ? [] | [First, ...TupleSlice<Rest>]
 *   : []
 * } TupleSlice
 */

/**
 * Helper type to create tuple types since TS takes values like `[1, 2]` as
 * `number[]` by default
 *
 * @type {<T extends any[]>(...t: T) => T}
 */
export const tuple = (...t) => t
