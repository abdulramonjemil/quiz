import { phraseToNode } from "@/core/content-parser"
import { cn } from "@/lib/dom"
import Styles from "@/scss/header.module.scss"

/**
 * @typedef {"h1" | "h2" | "h3" | "h4" | "h5" | "h6"} HeaderLevel
 */

const headerClasses = {
  root: cn("quiz-header", Styles.Header),
  element: cn("quiz-header-element", Styles.Header__Element)
}

/**
 * @param {Object} param0
 * @param {string} param0.labellingId
 * @param {HeaderLevel | null | undefined} param0.level
 * @param {string} content
 */
export default function Header({ labellingId, level }, content) {
  const HeadingLevel = level ?? "h2"
  return (
    <header className={headerClasses.root}>
      <HeadingLevel className={headerClasses.element} id={labellingId}>
        {phraseToNode(content)}
      </HeadingLevel>
    </header>
  )
}
