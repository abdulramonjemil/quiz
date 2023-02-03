module.exports = {
  babelrcRoots: [".", "./components"],
  plugins: [
    [
      "@babel/plugin-transform-react-jsx",
      {
        importSource: ".",
        runtime: "automatic"
      }
    ]
  ]
}
