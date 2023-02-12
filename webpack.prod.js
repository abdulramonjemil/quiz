/* eslint-disable import/no-extraneous-dependencies */
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin")
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")
const { merge } = require("webpack-merge")
const commonConfig = require("./webpack.config")
/* eslint-enable import/no-extraneous-dependencies */

const PATHS_TO_SASS_PARTIALS = ["partials"]

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
            loader: "resolve-url-loader"
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sassOptions: {
                loadPaths: PATHS_TO_SASS_PARTIALS
              }
            }
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
            loader: "resolve-url-loader"
          },
          {
            loader: "sass-loader",
            options: {
              sourceMap: true,
              sassOptions: {
                loadPaths: PATHS_TO_SASS_PARTIALS
              }
            }
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
