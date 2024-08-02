export const createFormatFactory = (() => {
  const baseCharFormatRegexp =
    /(?<!@|(?<!\\)\\(?:\\\\)*)(@+)(?!@)(.+?)(?<!@|(?<!\\)\\(?:\\\\)*)\1(?!@)/g
  const baseEscapeRegexp = /\\+(?=@|<\/?tagname>)/g

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
   * @param {string} char
   * @param {string} tagName
   */
  return (char, tagName) => {
    const c = `\\${char}`
    const charFormatRegex = RegExp(
      baseCharFormatRegexp.source.replace(/@/g, c),
      baseCharFormatRegexp.flags
    )
    const escapeRegexp = RegExp(
      baseEscapeRegexp.source.replace(/@/g, c).replace(/tagname/g, tagName),
      baseEscapeRegexp.flags
    )

    /**
     * Used with character format regexp to replace content enclosed i.e. the
     * value matched by the second capturing group (third parameter of replacer)
     *
     * @type {(...params: string[]) => string}
     */
    const charReplacer = (_, __, content) =>
      `<${tagName}>${content.trim()}</${tagName}>`

    /** @param {string} value */
    const formatString = (value) => {
      const charReplaced = value.replace(charFormatRegex, charReplacer)
      return charReplaced.replace(escapeRegexp, escapeReplacer)
    }

    return {
      char,
      tagName,
      format: formatString
    }
  }
})()
