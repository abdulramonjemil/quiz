import { createContext } from "@/jsx"

/**
 * @typedef {{ classPrefix: string }} GlobalConfig
 */

export const globalConfigCtx =
  /** @type {typeof createContext<GlobalConfig>} */ (createContext)({
    classPrefix: "quiz"
  })
