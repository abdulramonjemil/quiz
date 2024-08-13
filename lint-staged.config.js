module.exports = {
  "*.{js,jsx,ts,tsx}": ["eslint", "prettier --check"],
  "*.{html,json,md,scss}": "prettier --check",
  "*.scss": "stylelint"
}
