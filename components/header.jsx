import { phraseToNode } from "../core/content-parser"
import styles from "../scss/header.module.scss"

export default function Header({ labellingId }, content) {
  return (
    <header className={styles.header}>
      <h1 className={styles.header__main} id={labellingId}>
        {phraseToNode(content)}
      </h1>
    </header>
  )
}
