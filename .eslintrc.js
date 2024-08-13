module.exports = {
  extends: [
    "plugin:import/recommended",
    "airbnb",
    "airbnb-typescript",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked",
    "prettier"
  ],

  env: { browser: true },
  ignorePatterns: ["/*", "!src/", "!__jsnotes.jsx", "!__tsnotes.tsx"],
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],

  parserOptions: {
    ecmaVersion: "latest",
    project: "./tsconfig.eslint.json"
  },

  settings: {
    "import/resolver": {
      alias: {
        map: [["@", "./src"]],
        extensions: [".js", ".jsx", ".ts", ".tsx"]
      }
    }
  },

  rules: {
    "@typescript-eslint/consistent-indexed-object-style": "off",
    "@typescript-eslint/lines-between-class-members": [
      "error",
      "always",
      { exceptAfterSingleLine: true }
    ],

    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-namespace": "off",
    "@typescript-eslint/no-unnecessary-boolean-literal-compare": "off",
    "@typescript-eslint/no-unsafe-argument": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",
    "@typescript-eslint/no-unsafe-return": "off",
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      { allowNever: true }
    ],

    "arrow-body-style": "off",

    "import/extensions": [
      "error",
      "always",
      { js: "never", jsx: "never", ts: "never", tsx: "never" }
    ],
    "import/prefer-default-export": "off",

    "max-classes-per-file": "off",
    "no-param-reassign": "off",
    "new-parens": ["error", "always"],
    "no-underscore-dangle": "off",

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
