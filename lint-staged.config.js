module.exports = {
  "*.{js,jsx}": ["eslint", "prettier --check"],
  "*.{html,json,md,scss}": "prettier --check",
  "*.scss": "stylelint"
}
