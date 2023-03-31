import { phraseToNode } from "../core/content-parser"
import Styles from "../scss/header.module.scss"

export default function Header({ labellingId }, content) {
  return (
    <header className={Styles.Header}>
      <h1 className={Styles.Header__MainElement} id={labellingId}>
        {phraseToNode(content)}
      </h1>
    </header>
  )
}
