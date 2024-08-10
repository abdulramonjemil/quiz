const BaseCharFormatRegexp =
  /(?<!@|(?<!\\)\\(?:\\\\)*)(@+)(?!@)(.+?)(?<!@|(?<!\\)\\(?:\\\\)*)\1(?!@)/g
const BaseEscapeRegexp = /\\+(?=@|<\/?tagname>)/g

export class FormatFactory {
  /**
   * Calling this function with a string helps to solve two problems
   * - Invalid HTML output from `format()`. Using "`" as char, we have
   *   "The `<code>` tag is here."  =>  "The <code><code></code> tag is here." (invalid HTML)
   * - Removal of backslashes not used with the format char like "@" or "`" e.g
   *   "Good \\<code> here."  =>  "Good <code> here." (backslashes removed)
   *
   * @param {string} value
   */
  static prepare(value) {
    const lessThanReplaced = value.replace(/</g, "&lt;")
    return lessThanReplaced.replace(/>/g, "&gt;")
  }

  /**
   * @param {string} char
   * @param {string} tagName
   */
  constructor(char, tagName) {
    const c = `\\${char}`
    const charFormatRegex = RegExp(
      BaseCharFormatRegexp.source.replace(/@/g, c),
      BaseCharFormatRegexp.flags
    )
    const escapeRegexp = RegExp(
      BaseEscapeRegexp.source.replace(/@/g, c).replace(/tagname/g, tagName),
      BaseEscapeRegexp.flags
    )

    /**
     * Used with escape regex to rewrite escape slashes in the string. An odd
     * number of backslashes before the special character (one or more) means the
     * last backslash is used to escape the character(s). This is enforced in the
     * character regexp. Also, each pair of backslashes means the first slash
     * escapes the second.
     *
     * @param {string} escapeSlashes
     */
    const escapeReplacer = (escapeSlashes) => {
      const matchLength = escapeSlashes.length
      return matchLength % 2 === 0
        ? "\\".repeat(matchLength / 2)
        : "\\".repeat((matchLength - 1) / 2)
    }

    /**
     * Used with character format regexp to replace content enclosed i.e. the
     * value matched by the second capturing group (third parameter of replacer)
     *
     * @type {(...params: string[]) => string}
     */
    const charReplacer = (_, __, content) =>
      `<${tagName}>${content.trim()}</${tagName}>`

    /** @protected @readonly */
    this.$charFormatRegex = charFormatRegex
    /** @protected @readonly */
    this.$escapeRegexp = escapeRegexp
    /** @protected @readonly */
    this.$charReplacer = charReplacer
    /** @protected @readonly */
    this.$escapeReplacer = escapeReplacer

    /** @readonly */
    this.char = char
    /** @readonly */
    this.tagName = tagName
  }

  /** @param {string} value */
  format(value) {
    const { $charFormatRegex, $charReplacer, $escapeRegexp, $escapeReplacer } =
      this

    const charReplaced = value.replace($charFormatRegex, $charReplacer)
    return charReplaced.replace($escapeRegexp, $escapeReplacer)
  }
}
