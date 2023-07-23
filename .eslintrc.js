module.exports = {
  extends: ["airbnb", "prettier"],
  env: { browser: true },
  parserOptions: {
    ecmaVersion: 2020
  },
  rules: {
    "import/extensions": ["error", "always", { js: "never", jsx: "never" }],
    "import/prefer-default-export": "off",
    "react/destructuring-assignment": "off",
    "react/jsx-no-bind": "off",
    "react/jsx-props-no-spreading": "off",
    "react/no-unknown-property": "off",
    "react/no-unused-class-component-methods": "off",
    "react/prefer-stateless-function": "off",
    "react/prop-types": "off",
    "react/sort-comp": "off",
    "react/style-prop-object": "off",
    "react/react-in-jsx-scope": "off"
  }
}
