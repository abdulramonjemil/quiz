/* PrismJS scripts */
import Prism from "prismjs"
import "prismjs/plugins/autoloader/prism-autoloader"

import { phraseToNode } from "@/core/content-parser"
import Styles from "@/scss/code-board.module.scss"
import { refHolder } from "@/core/base"

/**
 * @typedef {{
 *   title: string;
 *   language: string;
 *   snippet: string;
 * }} CodeBoardProps
 */

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

window.Prism = window.Prism || {}
Prism.plugins.autoloader.languages_path = PRISMJS_COMPONENTS_CDN_URL
Prism.manual = true

/** @param {CodeBoardProps} param0 */
export default function CodeBoard({ snippet, language, title }) {
  loadPrismTheme(DEFAULT_PRISM_THEME_URL)
  const codeRefHolder = refHolder()

  const codeBoardNode = (
    <div className={Styles.CodeBoard}>
      <p className={Styles.CodeBoard__Title}>{phraseToNode(title)}</p>
      <div className={Styles.CodeWrapper}>
        <pre className={Styles.Code}>
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
