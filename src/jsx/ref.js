// Used to brand ref holders
const REF_HOLER_BRAND_KEY_SYMBOL = Symbol("REF_HOLER_BRAND_KEY")
const IMMUTABLE_REF_HOLDER_SYMBOL = Symbol("IMMUTABLE_REF_HOLDER")
const MUTABLE_REF_HOLDER_SYMBOL = Symbol("MUTABLE_REF_HOLDER")

/**
 * @template {any} T
 * @typedef {{
 *   readonly ref: T,
 *   readonly [REF_HOLER_BRAND_KEY_SYMBOL]: typeof IMMUTABLE_REF_HOLDER_SYMBOL
 * }} RefHolder
 */

/**
 * @template {any} T
 * @typedef {{
 *   ref: T,
 *   readonly [REF_HOLER_BRAND_KEY_SYMBOL]: typeof MUTABLE_REF_HOLDER_SYMBOL
 * }} MutableRefHolder
 */

/* -------------------------------- *\
Overloads for `rh()` start here
\* -------------------------------- */

/**
 * @template {any} T
 * @overload
 * @param {T} value
 * @return {RefHolder<T>}
 */

/**
 * This is meant for ref holders that are used with ref props e.g.
 * `instanceRefHolder` and `nodeRefHolder`.
 *
 * @template {any} T
 * @overload
 * @param {T | null} value
 * @return {RefHolder<T>}
 */

/**
 * @template {any} [T=null]
 * @overload
 * @return {RefHolder<T | null>}
 */

/**
 * Creates a ref holder
 *
 * @param {any[]} value
 * @returns {RefHolder<any>}
 */
export function rh(...value) {
  if (value.length > 0) {
    return {
      ref: value[0],
      [REF_HOLER_BRAND_KEY_SYMBOL]: IMMUTABLE_REF_HOLDER_SYMBOL
    }
  }

  return {
    ref: null,
    [REF_HOLER_BRAND_KEY_SYMBOL]: IMMUTABLE_REF_HOLDER_SYMBOL
  }
}

/* -------------------------------- *\
Overloads for `rh()` end here
\* -------------------------------- */

/* -------------------------------- *\
Overloads for `mrh()` start here
\* -------------------------------- */

/**
 * @template {any} T
 * @overload
 * @param {T} value
 * @returns {MutableRefHolder<T>}
 */

/**
 * This is meant for ref holders that are used with ref props e.g.
 * `instanceRefHolder` and `nodeRefHolder`.
 *
 * @template {any} T
 * @overload
 * @param {T | null} value
 * @returns {MutableRefHolder<T>}
 */

/**
 * @template {any} [T=null]
 * @overload
 * @returns {MutableRefHolder<T | null>}
 */

/**
 * Creates a ref holder
 *
 * @param {any[]} value
 * @returns {MutableRefHolder<any>}
 */
export function mrh(...value) {
  if (value.length > 0) {
    return {
      ref: value[0],
      [REF_HOLER_BRAND_KEY_SYMBOL]: MUTABLE_REF_HOLDER_SYMBOL
    }
  }

  return {
    ref: null,
    [REF_HOLER_BRAND_KEY_SYMBOL]: MUTABLE_REF_HOLDER_SYMBOL
  }
}

/* -------------------------------- *\
Overloads for `mrh()` end here
\* -------------------------------- */

/** @type {<T extends any>(value: any) => value is RefHolder<T>} */
export function isRH(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, "ref") &&
    value[REF_HOLER_BRAND_KEY_SYMBOL] === IMMUTABLE_REF_HOLDER_SYMBOL
  )
}

/** @type {<T extends any>(value: any) => value is MutableRefHolder<T>} */
export function isMRH(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    Object.prototype.hasOwnProperty.call(value, "ref") &&
    value[REF_HOLER_BRAND_KEY_SYMBOL] === MUTABLE_REF_HOLDER_SYMBOL
  )
}
