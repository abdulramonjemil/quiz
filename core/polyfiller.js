/**
 * This function imports a polyfill for @container CSS queries if not supported.
 * The polyfill used is at "https://github.com/GoogleChromeLabs/container-query-polyfill"
 */
function polyfillContainerQueries() {
  const containerQueriesAreSupported =
    "container" in document.documentElement.style

  if (!containerQueriesAreSupported) {
    const CQ_POLYFILL_URL =
      "https://cdn.jsdelivr.net/npm/container-query-polyfill@1/dist/container-query-polyfill.modern.js"
    const script = document.createElement("script")
    script.src = CQ_POLYFILL_URL
    document.head.appendChild(script)
  }
}

function polyfillForBrowser() {
  polyfillContainerQueries()
}

const Polyfiller = { polyfillForBrowser }
export default Polyfiller
