import { htmlStringToFragment } from "./base"
import { FormatFactory } from "./format-factory"

const codeFormatFactory = new FormatFactory("`", "code")
const italicFormatFactory = new FormatFactory("_", "em")
const boldFormatFactory = new FormatFactory("*", "strong")
const strikeThroughFormatFactory = new FormatFactory("~", "del")

const ContentPrefixes = /** @type {const} */ ({
  html: "html:",
  raw: "raw:",
  formatted: "fmt:"
})

/** @typedef {keyof typeof ContentPrefixes} ContentType */

/**
 * @param {string} content
 * @return {{ type: ContentType, value: string }}
 */
function getContentData(content) {
  const prefixes = /** @type {ContentType[]} */ (Object.keys(ContentPrefixes))
  const prefix = prefixes.find((p) => content.startsWith(ContentPrefixes[p]))
  return {
    type: prefix ?? "formatted",
    value: prefix ? content.substring(ContentPrefixes[prefix].length) : content
  }
}

/**
 * @param {string} content
 * @returns {Node}
 */
export function contentNode(content) {
  const { type, value: contentValue } = getContentData(content)
  if (type === "raw") return document.createTextNode(contentValue)
  if (type === "html") return htmlStringToFragment(contentValue)

  const formatted = [
    codeFormatFactory,
    italicFormatFactory,
    boldFormatFactory,
    strikeThroughFormatFactory
  ].reduce((val, factory) => {
    const { char } = factory
    // No need to format if it'll surely return same thing
    if (val.lastIndexOf(char) - val.indexOf(char) <= 1) return val
    return factory.format(FormatFactory.prepare(val))
  }, contentValue)

  if (formatted === contentValue) return document.createTextNode(contentValue)
  return htmlStringToFragment(formatted)
}
