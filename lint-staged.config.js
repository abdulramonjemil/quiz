module.exports = {
  "*.{js,jsx}": ["eslint", "prettier --check"],
  "*.{json,scss,md}": "prettier --check",
  "*.scss": "stylelint"
}
