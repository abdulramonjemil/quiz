import Quiz from "./components/quiz"

/**
 * -------------------------------------------
 * Polyfill container queries if not supported
 * -------------------------------------------
 */
const containerQueriesAreSupported =
  "container" in document.documentElement.style

if (!containerQueriesAreSupported) {
  const polyfillURL =
    "https://cdn.jsdelivr.net/npm/container-query-polyfill@1/dist/container-query-polyfill.modern.js"
  const script = document.createElement("script")
  script.src = polyfillURL
  document.head.appendChild(script)
}

// @ts-expect-error -- Since type `Quiz` doesn't exist on `Window` by default
window.Quiz = Quiz
