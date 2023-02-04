module.exports = {
  babelrcRoots: [".", "./components"],
  plugins: [
    [
      "@babel/plugin-transform-react-jsx",
      {
        importSource: "./core",
        runtime: "automatic"
      }
    ]
  ]
}
