import { ctx } from "@/jsx/context"
import { Namespaces } from "./base"

export const nsCtx = /** @type {typeof ctx<string>} */ (ctx)(Namespaces.html)
export const ns = {
  ...nsCtx,
  /** @param {string} namespace */
  url: (namespace) => nsCtx.use(namespace),
  svg: () => nsCtx.use(Namespaces.svg),
  mathml: () => nsCtx.use(Namespaces.mathml)
}
