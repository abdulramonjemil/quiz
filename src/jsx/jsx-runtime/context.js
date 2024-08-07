import { uniqueId } from "@/lib/factory"
import { Namespaces, SpecialIntrinsicProps } from "./base"

/**
 * @typedef {import("./base").NormalizedElementProps} NormalizedElementProps
 */

// eslint-disable-next-line no-underscore-dangle
export const nsCtx = (() => {
  const registered = /** @type {[branded: string, real: string][]} */ ([])
  /**
   * Since unlike react, jsx is converted directly into the appropriate element,
   * we rely on this function to tell the jsx runtime which namespace to use to
   * create elements. For example, <a> can HTMLAnchor or SVGAElement. By
   * specifying the appropriate NS e.g at `<svg xmlns={nsCtx(__SVG_NAMESPACE__)}>`,
   * the runtime can create the appropriate object.
   *
   * @param {string} namespace
   */
  const useNS = (namespace) => {
    const branded = `${namespace}::${uniqueId()}`
    registered.push([branded, namespace])
    return branded
  }

  /**
   * Returns the appropriate namespace to use based on registered namespaces.
   * @param {NormalizedElementProps} elementProps
   */
  const mutateNS = (elementProps) => {
    const nsprop = elementProps[SpecialIntrinsicProps.namespace]
    const nextNS = registered[registered.length - 1]
    if (typeof nsprop !== "string") return nextNS ? nextNS[1] : null
    if (!nextNS) return nsprop

    const [brandedNS, realNS] = nextNS
    if (nsprop !== brandedNS) return nsprop // nsprop is not branded
    registered.pop() // nsprop is branded, current element is namespace root
    return realNS
  }

  /**
   * @param {NormalizedElementProps} elementProps
   * @param {string | null} derivedNS
   */
  const nsAttrFor = (elementProps, derivedNS) => {
    const nsprop = elementProps[SpecialIntrinsicProps.namespace]
    if (typeof nsprop !== "string" || derivedNS === null) return null
    if (nsprop === derivedNS) return nsprop // `nsprop` is not branded
    return derivedNS // `nsprop` is branded
  }

  return { use: useNS, mutate: mutateNS, attrFor: nsAttrFor }
})()

export const ns = {
  /** @param {string} namespace */
  url: (namespace) => nsCtx.use(namespace),
  svg: () => nsCtx.use(Namespaces.svg),
  mathml: () => nsCtx.use(Namespaces.mathml)
}
