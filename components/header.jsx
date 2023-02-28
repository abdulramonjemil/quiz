import { phraseToNode } from "../core/content-parser"

export default function Header({ labellingId }, children) {
  return (
    <header>
      <h1 id={labellingId}>{phraseToNode(children)}</h1>
    </header>
  )
}
