/**
 * This file imports a polyfill for @container CSS queries if not supported.
 * The polyfill used is at "https://github.com/GoogleChromeLabs/container-query-polyfill"
 */
function polyfillContainerQueries() {
  const CQ_POLYFILL_URL =
    "https://cdn.jsdelivr.net/npm/container-query-polyfill@1/dist/container-query-polyfill.modern.js"

  const containerQueriesAreSupported =
    "container" in document.documentElement.style

  if (!containerQueriesAreSupported) import(CQ_POLYFILL_URL)
}

function polyfillBrowser() {
  polyfillContainerQueries()
}

const Polyfiller = { polyfillBrowser }
export default Polyfiller
