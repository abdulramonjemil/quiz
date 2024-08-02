/** @param {string} htmlString */
export function htmlStringToFragment(htmlString) {
  const div = document.createElement("div")
  div.innerHTML = htmlString
  const fragment = new DocumentFragment()
  fragment.append(...div.childNodes)
  return fragment
}
