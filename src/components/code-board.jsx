/* PrismJS scripts */
import Prism from "prismjs"
import "prismjs/plugins/autoloader/prism-autoloader"

import { phraseToNode } from "@/core/content-parser"
import Styles from "@/scss/code-board.module.scss"
import { rh } from "@/core/base"
import { cn } from "@/lib/dom"

/**
 * @typedef {{
 *   title: string;
 *   language: string;
 *   snippet: string;
 *   theme?: "basic" | "default" | "none" | (string & {}) | null | undefined
 * }} CodeBoardProps
 */

const codeClasses = {
  root: cn("quiz-cboard", Styles.CodeBoard),
  title: cn("quiz-cboard-title", Styles.CodeBoard__Title),
  preWrapper: cn("quiz-cboard-pre-wrapper", Styles.PreWrapper),
  pre: {
    base: cn("quiz-cboard-pre", Styles.Pre),
    basicThemed: cn("quiz-cboard-pre--basic", Styles.Pre_basicThemed),
    defaultThemed: cn(["quiz-cboard-pre--default", Styles.Pre_defaultThemed])
  }
}

const DEFAULT_PRISM_THEME_URL =
  "https://cdn.jsdelivr.net/gh/PrismJS/prism-themes/themes/prism-material-oceanic.css"
const PRISMJS_COMPONENTS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/prismjs@1.x/components/"

/** @param {string} url  */
export function loadPrismTheme(url) {
  const linkToInsert = /** @type {HTMLLinkElement} */ (
    <link rel="stylesheet" href={url} />
  )
  const links = Array.from(document.head.querySelectorAll("link"))
  const sameLinkExists = links.some(
    (link) => link.rel === "stylesheet" && link.href === linkToInsert.href
  )

  if (sameLinkExists) return
  document.head.prepend(linkToInsert)
}

window.Prism = window.Prism || /** @type {typeof Prism} */ ({})
Prism.plugins.autoloader.languages_path = PRISMJS_COMPONENTS_CDN_URL
Prism.manual = true

/** @param {CodeBoardProps} param0 */
export default function CodeBoard({ title, language, snippet, theme }) {
  const basicThemed = theme === "basic" || !theme
  const defaultThemed = theme === "default"
  const noTheme = theme === "none"
  const customThemed = !basicThemed && !defaultThemed && !noTheme

  if (defaultThemed) loadPrismTheme(DEFAULT_PRISM_THEME_URL)
  else if (customThemed) loadPrismTheme(theme)

  const codeRefHolder = /** @type {typeof rh<HTMLElement>} */ (rh)(null)

  const codeBoardNode = (
    <div className={codeClasses.root}>
      <p className={codeClasses.title}>{phraseToNode(title)}</p>
      <div className={codeClasses.preWrapper}>
        <pre
          className={cn([
            codeClasses.pre.base,
            [basicThemed, codeClasses.pre.basicThemed],
            [defaultThemed, codeClasses.pre.defaultThemed]
          ])}
        >
          <code className={`language-${language}`} refHolder={codeRefHolder}>
            {snippet.trim()}
          </code>
        </pre>
      </div>
    </div>
  )

  Prism.highlightElement(codeRefHolder.ref)
  return codeBoardNode
}
