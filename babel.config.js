module.exports = {
  babelrcRoots: [".", "./components"],
  plugins: [
    [
      "@babel/plugin-transform-react-jsx",
      {
        runtime: "automatic",
        importSource: "."
      }
    ]
  ]
}
