/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable import/no-extraneous-dependencies */
const MiniCssExtractPlugin = require("mini-css-extract-plugin")
const path = require("path")
const { merge } = require("webpack-merge")
const baseConfig = require("./webpack.config")
/* eslint-enable import/no-extraneous-dependencies */

/** @import { Configuration } from "webpack" */

const extendedConfig = /** @type {Configuration} */ ({
  devServer: {
    devMiddleware: {
      writeToDisk(filePath) {
        return !/hot-update/i.test(filePath)
      }
    },
    open: false,
    port: 8000,
    static: [
      {
        directory: path.join(__dirname, "/src/public"),
        publicPath: "/",
        watch: true
      },
      {
        directory: path.join(__dirname, "dist"),
        publicPath: "/dist",
        watch: true
      }
    ]
  },

  mode: "development",
  output: {
    filename: "quiz.bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [new MiniCssExtractPlugin({ filename: "quiz.bundle.css" })]
})

module.exports = merge(baseConfig, extendedConfig)
