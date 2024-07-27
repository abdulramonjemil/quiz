module.exports = {
  plugins: [
    [
      "@babel/plugin-transform-react-jsx",
      {
        importSource: "@/core",
        runtime: "automatic"
      }
    ]
  ]
}
