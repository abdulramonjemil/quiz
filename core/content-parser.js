import { escapeHTMLContent, htmlStringToFragment } from "./library"

/**
 * The following terms are used in the descriptions of regular expressions used
 * further down below:
 *
 * - String expressions and strings: A string expression is a unit of code that
 *   resolves to a string value. The string value resolved to is a "string". For
 *   example, the following can be both a string expression and a string. "No \\
 *   in here" As a string expression, it resolves to the string value "No \ in
 *   here" because the first backslash escapes the second. As a string (not
 *   string expression) its value is still "No \\ in here", and the string
 *   expression that will produce it will be "No \\\\ in here" (four backslashes
 *   have to be used in the expression to produce two in the value resolved to).
 *
 * NOTE: Names of characters used directly or in phrases refer to their string
 * representations. For example, a backslash is the string "\".
 *
 * - An opening/closing code tag: An opening code tag is the string "<code>" and
 *   a closing code tag is the string "</code>".
 *
 * - A code tag: An opening code tag or a closing code tag.
 *
 * - A set of backslashes: One or more backslashes directly following one
 *   another which are not directly preceded, or directly followed by a
 *   backslash. For example, the string "\\\ and \ are sets" contains two sets
 *   of backslashes.
 *
 * - Size of a set of backslashes: The count of the backslashes in the set. For
 *   example, the string "I don't use \ in code" has one set of backslashes, and
 *   the size of the set is 1. The string "No \\\ or '\\\' can be used" on the
 *   other hand, contains two sets of backslashes, both of which have a size of
 *   3 each.
 *
 * - A set of backticks: One or more backticks directly following one another
 *   which are not directly preceded, or directly followed by a backtick. For
 *   example, the string "Find ``` in the text" contains one set of backticks,
 *   while the string "I like the `code` tag" contains two.
 *
 * - Size of a set of backticks: The count of the backticks in the set. For
 *   example, the string "Avoid using `` in code" contains one set of backticks
 *   and the size of the set is 2, while the string "What about ````?" contains
 *   one set of backticks too, but whose size is 4.
 *
 * - An escaped set of backticks: A set of backticks that is directly preceded
 *   by a set of backslashes whose size is an odd number. For example, the
 *   string "Why I dont use \\\`` in my code" contains one escaped set of
 *   backticks since the set of backticks in it are directly preceded by a set
 *   of backslashes whose size is 3, and 3 is an odd number. The last backslash
 *   in the set of backslashes is considered an escape character for the set of
 *   backticks, while the pairs of backslashes that directly bcome before it are
 *   taken such that the first backslash in each pair escapes the second.
 *
 * - An unescaped set of backticks: A set of backticks that is not escaped. For
 *   example, the string "Use ``gh`` in your terminal" contains two unescaped
 *   set of backticks. The string "I hate \\\\` and \\``" also contains two
 *   unescaped set of backticks.
 *
 * - A special set of backslashes: A set of backslashes directly preceding a
 *   code tag or a set of backticks.
 *
 * - A code definition: A string that:
 *   1 - begins with an unescaped set of backticks, followed by
 *   2 - one or more characters which do not contain an unescaped set of
 *     backticks whose size is the same as the size of that in (1) above,
 *     followed by
 *   3 - an unescaped set of backticks whose size is the same as the size of
 *     that in (1) above.
 *
 * - A code content: The part of a code definition that belongs to its part (2).
 */

/**
 * Matches code definitions in a string.
 *
 * The first capture group is the unescaped set of backticks at the beginning of
 * the matched string. The second is the part of the string that should be
 * wrapped in <code> tags.
 *
 * This definition allows for the containment of backticks in code contents
 * using more or less backticks. For example, in the string "Write ```use ``
 * --simple``` for usage", this regex matches "```use `` --simple```", and the
 * second capture group will be "use `` --simple", which can be passed to the
 * replacer function to wrap it in <code> tags. Since the first unescaped set of
 * backticks it encounters has a size of 3, it'll only end the match when if
 * finds another unescaped set of backticks with a size of 3 (no more, no less).
 * Two sets of backticks with a size of 1 can also be used for this purpose
 * since the number of backticks to be included in <code> tags is 2 i.e "`use ``
 * --simple`" will also work in place of "```use `` --simple```".
 */
const CODE_DEFINITIONS_REGEX =
  /(?<!`|(?<!\\)\\(?:\\\\)*(?!\\))(`+)(?!`)(.+?)(?<!`|(?<!\\)\\(?:\\\\)*(?!\\))\1(?!`)/g

/**
 * Matches special sets of backslashes in a string.
 */
const SPECIAL_SETS_OF_BACKSLASHES_REGEX = /(?<!\\)\\+(?=`|<\/?code>)/g

/**
 * Used as a replacer with CODE_DEFINITIONS_REGEX above. It inserts code
 * contents matched in <code> tags. The string is trimmed to allow for backticks
 * at the start and end of code contents. For example, when the string "`` ` ``"
 * is passed, the unnecessary spaces are removed, and the function returns
 * "<code>`<code>". Without the spaces, the string would be "`````" and that
 * would be interpreted as one set of backticks.
 */
const DEFINE_CODE_ELEMENTS = (_, __, codeContent) =>
  `<code>${codeContent.trim()}</code>`

/**
 * Used as a replacer with SPECIAL_SETS_OF_BACKSLASHES_REGEX above. It removes
 * parts of special backslashes found as needed.
 *
 * Special backslashes sets with even number sizes are directly cut in half to
 * mean that each even number indexed backslash escapes the backslash at its
 * index + 1. As such, the function will return "\\" when passed "\\\\", and "\"
 * when passed "\\". In the first example, the "\" at index 0 is considered to
 * have been used to escape the one at index 1, and the one at index "2" to have
 * escaped the one at index 3.
 *
 * On the other hand, special backslashes sets with odd number sizes have their
 * backslashes count reduced by 1 before cutting in half. This is to mean the
 * same thing as before, but in addition to that, that the last backslash in the
 * set is used to escape the content after it. As such, the function will return
 * "\" when passed "\\\", and "" when passed "\". In the first example, the "\"
 * at index 0 is considered to have escaped the one at index 1, and the one at
 * index 2 to have escaped the content after it.
 */
const REMOVE_ESCAPE_BACKSLASHES = (specialSetOfBackslashes) => {
  const matchLength = specialSetOfBackslashes.length
  return matchLength % 2 === 0
    ? "\\".repeat(matchLength / 2)
    : "\\".repeat((matchLength - 1) / 2)
}

/**
 * Extracts and convert code definitions in `content` to <code> tags. The
 * function does the following:
 * 1 - Escapes all HTML chars in `content`, all ">" for example become "&gt;"
 * 2 - Replaces code definitions with <code> tags using CODE_DEFINITIONS_REGEX
 *   and DEFINE_CODE_ELEMENTS replacer. For example, if `content` is the
 *   string "Dont write `user` in your code", it's converted to "Dont write
 *   <code>user</code> in your code"
 * 3 - Normalizes special backslashes SPECIAL_SETS_OF_BACKSLASHES_REGEX and
 *   REMOVE_ESCAPE_BACKSLASHES. This helps remove backslashes treated by
 *   CODE_DEFINITIONS_REGEX as escape backslashes for sets of backticks (the
 *   last backslash in a set of backslashes with an odd number size).
 */
export function parseCodeDefinitions(content) {
  if (typeof content !== "string")
    throw new TypeError("'content' must be a string")

  const contentWithCodeTags = escapeHTMLContent(content).replace(
    CODE_DEFINITIONS_REGEX,
    DEFINE_CODE_ELEMENTS
  )

  const contentWithoutEscapeChars = contentWithCodeTags.replace(
    SPECIAL_SETS_OF_BACKSLASHES_REGEX,
    REMOVE_ESCAPE_BACKSLASHES
  )

  return htmlStringToFragment(contentWithoutEscapeChars)
}

const LENGTH_OF_CONTENT_MODIFIERS = 2
const START_OF_CODE_CONTAINING_CONTENT = "~~"
const START_OF_RAW_CONTENT = "__"
const START_OF_RAW_HTML_CONTENT = "##"

export function phraseToNode(content, allowRawHTML = true) {
  if (typeof content !== "string")
    throw new TypeError("'content' must be a string")

  if (content.startsWith(START_OF_CODE_CONTAINING_CONTENT)) {
    const codeContainingContent = content.substring(LENGTH_OF_CONTENT_MODIFIERS)
    return parseCodeDefinitions(codeContainingContent)
  }

  if (content.startsWith(START_OF_RAW_CONTENT)) {
    const rawContent = content.substring(LENGTH_OF_CONTENT_MODIFIERS)
    return document.createTextNode(rawContent)
  }

  if (content.startsWith(START_OF_RAW_HTML_CONTENT)) {
    if (!allowRawHTML) throw new TypeError("Raw HTML is not allowed")
    const htmlString = content.substring(LENGTH_OF_CONTENT_MODIFIERS)
    return htmlStringToFragment(htmlString)
  }

  return document.createTextNode(content)
}
