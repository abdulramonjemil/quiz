module.exports = {
  presets: ["@babel/preset-typescript"],
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
