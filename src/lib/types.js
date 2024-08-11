/**
 * @template {any[]} T
 * @typedef {T extends [infer First, ...infer Rest]
 *   ? [] | [First, ...TupleSlice<Rest>]
 *   : []
 * } TupleSlice
 */

export {}
