import { uniqueId } from "@/lib/factory"

const CONTEXT_DATA_SYMBOL_KEY = Symbol("CONTEXT_DATA_SYMBOL_KEY")
const CONTEXT_DATA_SYMBOL = Symbol("CONTEXT_DATA")

// eslint-disable-next-line no-underscore-dangle
const __ContextDataMap__ = (() => {
  const map = /** @type {Map<string, ContextData[]>} */ (new Map())
  return { get: map.get.bind(map), set: map.set.bind(map) }
})()

/**
 * @param {ContextData} contextData
 */
// eslint-disable-next-line no-underscore-dangle
export function __forbiddenPopContextDataFromStack__(contextData) {
  const { contextId, usageId, value } = contextData
  const contextStack = __ContextDataMap__.get(contextId)

  if (!Array.isArray(contextStack)) {
    throw new Error(`Invalid context data with contextId: '${contextId}'`)
  }

  const lastRegistered = contextStack.at(contextStack.length - 1)
  if (!lastRegistered) {
    throw new Error(
      `No existing context data to mutate. contextId: '${contextId}'`
    )
  }

  if (lastRegistered.usageId !== usageId || lastRegistered.value !== value) {
    throw new Error(
      `Expected context data to match last inserted to pop from context stack.` +
        ` contextId: '${contextId}'`
    )
  }

  contextStack.pop()
}

/**
 * @template {any} [T=any]
 * @typedef {{
 *   value: T,
 *   usageId: string,
 *   contextId: string,
 *   readonly [CONTEXT_DATA_SYMBOL_KEY]: typeof CONTEXT_DATA_SYMBOL
 * }} ContextData
 */

/**
 * @template {any} [T=any]
 * @typedef {{
 *   readonly id: string,
 *   readonly use: (value: NonNullable<T>) => ContextData<NonNullable<T>>,
 *   readonly value: () => T
 * }} Context
 */

/**
 * @template T
 * @typedef {T extends Context<infer R> ? R : never} ContextType
 */

/**
 * @param {any} value
 * @returns {value is ContextData}
 */
export function isContextData(value) {
  if (typeof value !== "object" || value === null) return false

  const val = /** @type {ContextData} */ (value)
  if (val[CONTEXT_DATA_SYMBOL_KEY] !== CONTEXT_DATA_SYMBOL) return false

  const contextStack = __ContextDataMap__.get(val.contextId)
  if (!contextStack) return false
  return true
}

/* -------------------------------- *\
Overloads for `createContext` start here
\* -------------------------------- */

/**
 * @template {any} T
 * @overload
 * @param {T} defaultValue
 * @return {Context<T>}
 */

/**
 * @template {any} [T=null]
 * @overload
 * @return {Context<T | null>}
 */

/**
 * @template {any} T
 * @param {T[]} defaultValue
 * @returns {Context<T | null>}
 */
export function createContext(...defaultValue) {
  const values = /** @type {ContextData<T | null>[]} */ ([])
  const contextId = uniqueId()
  __ContextDataMap__.set(contextId, values)

  /**
   * @param {NonNullable<T>} value
   * @returns {ContextData<NonNullable<T>>}
   */
  const useContextValue = (value) => {
    const usageId = uniqueId()
    const data = /** @type {const} */ ({
      usageId,
      contextId,
      value,
      [CONTEXT_DATA_SYMBOL_KEY]: CONTEXT_DATA_SYMBOL
    })

    values.push(data)
    return data
  }

  const getContextValue = () => {
    const lastRegistered = values.at(values.length - 1)
    if (!lastRegistered) return defaultValue[0] ?? null
    return lastRegistered.value
  }

  return {
    id: contextId,
    use: useContextValue,
    value: getContextValue
  }
}

/**
 * @param {Object} param0
 * @param {any} [param0.children]
 * @param {ContextData | ContextData[]} param0.data
 */
export function ContextProvider({ children, data }) {
  if (!Array.isArray(data)) {
    __forbiddenPopContextDataFromStack__(data)
    return children
  }

  const poppedContextIDs = /** @type {Set<string>} */ (new Set())
  // The data is reversed so that in case there are multiple context data for a
  // single context, the last inserted is first popped and so on, and no error
  // is thrown.
  ;[...data].reverse().forEach((d) => {
    if (poppedContextIDs.has(d.contextId)) {
      throw new Error(
        `Only one context data may be supplied for a single context. ` +
          `Got multiple for context with id: \n\n${d.contextId}\n`
      )
    }

    __forbiddenPopContextDataFromStack__(d)
    poppedContextIDs.add(d.contextId)
  })
  return children
}
