/* eslint-disable import/no-extraneous-dependencies */
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")
const { merge } = require("webpack-merge")
const commonConfig = require("./webpack.config")
/* eslint-enable import/no-extraneous-dependencies */

module.exports = merge(commonConfig, {
  mode: "production",
  optimization: {
    minimizer: [new CssMinimizerPlugin(), "..."]
  },
  output: {
    filename: "quiz.min.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [new MiniCssExtractPlugin({ filename: "quiz.min.css" })]
})
