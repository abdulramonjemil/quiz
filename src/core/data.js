import { ctx } from "@/jsx"

/**
 * @typedef {{ classPrefix: string }} GlobalConfig
 */

export const globalConfigCtx = /** @type {typeof ctx<GlobalConfig>} */ (ctx)({
  classPrefix: "quiz"
})
