/* PrismJS scripts */
import Prism from "prismjs"
import "prismjs/plugins/autoloader/prism-autoloader"

import { createElementRefHolder } from "@/core/component"
import { phraseToNode } from "@/core/content-parser"
import Styles from "@/scss/code-board.module.scss"

/**
 * @typedef {{
 *   title: string;
 *   language: string;
 *   snippet: string;
 * }} CodeBoardProps
 */

const PRISMJS_COMPONENTS_CDN_URL =
  "https://cdn.jsdelivr.net/npm/prismjs@1.x/components/"

window.Prism = window.Prism || {}
Prism.plugins.autoloader.languages_path = PRISMJS_COMPONENTS_CDN_URL
Prism.manual = true

/** @param {CodeBoardProps} param0 */
export default function CodeBoard({ snippet, language, title }) {
  const codeRefHolder = createElementRefHolder()
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
