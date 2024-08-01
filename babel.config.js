module.exports = {
  plugins: [
    [
      "@babel/plugin-transform-react-jsx",
      {
        importSource: "@/jsx",
        runtime: "automatic"
      }
    ]
  ]
}
