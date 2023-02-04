/* eslint-disable import/no-extraneous-dependencies */
const path = require("path")
const { merge } = require("webpack-merge")
const HTMLWebpackPlugin = require("html-webpack-plugin")
const commonConfig = require("./webpack.config")
/* eslint-enable import/no-extraneous-dependencies */

module.exports = merge(commonConfig, {
  devServer: {
    open: true,
    port: 8000,
    static: {
      watch: true
    }
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.(sa|sc)ss$/,
        use: [
          {
            loader: "style-loader"
          },
          {
            loader: "css-loader",
            options: {
              modules: true
            }
          },
          {
            loader: "sass-loader"
          }
        ]
      }
    ]
  },
  output: {
    filename: "quiz.bundle.js",
    path: path.resolve(__dirname, "dist")
  },
  plugins: [
    new HTMLWebpackPlugin({
      inject: "head",
      scriptLoading: "blocking",
      template: "./public/template.html"
    })
  ]
})
