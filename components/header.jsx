import { phraseToNode } from "../core/content-parser"
import styles from "../scss/header.module.scss"

export default function Header({ labellingId }, children) {
  return (
    <header>
      <h1 className={styles.header} id={labellingId}>
        {phraseToNode(children)}
      </h1>
    </header>
  )
}
