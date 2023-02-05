/* eslint-disable import/no-extraneous-dependencies */
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")
const { merge } = require("webpack-merge")
const commonConfig = require("./webpack.config")
/* eslint-enable import/no-extraneous-dependencies */

module.exports = merge(commonConfig, {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.scss$/,
        exclude: /\.module\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: "icss"
              }
            }
          },
          {
            loader: "sass-loader"
          }
        ]
      },
      {
        test: /\.module\.scss$/,
        use: [
          {
            loader: MiniCssExtractPlugin.loader
          },
          {
            loader: "css-loader",
            options: {
              modules: {
                mode: "local"
              }
            }
          },
          {
            loader: "sass-loader"
          }
        ]
      }
    ]
  },
  optimization: {
    minimizer: [new CssMinimizerPlugin(), "..."]
  },
  output: {
    filename: "quiz.bundle.min.js",
    path: path.resolve(__dirname, "build")
  },
  plugins: [new MiniCssExtractPlugin({ filename: "quiz.bundle.min.css" })]
})
