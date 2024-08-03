module.exports = {
  extends: ["stylelint-config-standard-scss", "stylelint-config-prettier-scss"],
  rules: {
    "declaration-empty-line-before": null,
    "max-nesting-depth": 3,
    "property-no-unknown": [
      true,
      {
        ignoreSelectors: [":export"]
      }
    ],
    "scss/at-if-no-null": null,
    "scss/at-mixin-argumentless-call-parentheses": "always",
    "scss/at-use-no-unnamespaced": true,
    "scss/dollar-variable-empty-line-before": null,
    "scss/double-slash-comment-empty-line-before": null,
    "selector-class-pattern": [
      // This pattern matches classes in the following formats (not an
      // exhaustive list), a variant of BEM. See https://getbem.com/naming/ to
      // learn about the Block-Element-Modifier methodology.
      //
      // - .Block
      // - .AnotherBlock
      // - .Block__Elem
      // - .AnotherBlock__Elem
      // - .Block__AnotherElem
      // - .Block__Elem_mod (modifier begins with '_' and lowercase letter)
      // - .Block__Elem_fullMod
      /^(?:[A-Z][a-z][a-z0-9]*)+(?:(?:__)([A-Z][a-z][a-z0-9]*)+)?(?:_[a-z]+(?:[A-Z][a-z]+)*)?$/,
      {
        message: (selector) =>
          `Expected class selector '${selector}' to be in form of 'Block__Elem_mod'. ` +
          "See config for more info."
      }
    ],
    "selector-pseudo-class-no-unknown": [
      true,
      { ignorePseudoClasses: ["export"] }
    ]
  }
}
