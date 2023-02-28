import { phraseToNode } from "../core/content-parser"
import styles from "../scss/header.module.scss"

export default function Header({ labellingId }, content) {
  return (
    <header>
      <h1 className={styles.header} id={labellingId}>
        {phraseToNode(content)}
      </h1>
    </header>
  )
}
