module.exports = {
  entry: "./webpack.entry.js",
  module: {
    rules: [
      {
        test: /\.jsx$/,
        exclude: /node_modules/,
        use: ["babel-loader"]
      }
    ]
  },
  resolve: {
    extensions: [".js", ".jsx"]
  }
}
