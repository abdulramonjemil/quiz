/* eslint-disable import/no-extraneous-dependencies */
const path = require("path")
const { merge } = require("webpack-merge")
const HTMLWebpackPlugin = require("html-webpack-plugin")
const baseConfig = require("./webpack.config")
/* eslint-enable import/no-extraneous-dependencies */

module.exports = merge(baseConfig, {
  devServer: {
    open: false,
    port: 8000,
    static: {
      directory: path.join(__dirname, "public"),
      watch: true
    }
  },
  mode: "development",
  module: {
    rules: [
      {
        test: /\.scss$/,
        exclude: /\.module\.scss$/,
        use: [
          {
            loader: "style-loader"
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
              sourceMap: true
            }
          }
        ]
      },
      {
        test: /\.module\.scss$/,
        use: [
          {
            loader: "style-loader"
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
              sourceMap: true
            }
          }
        ]
      }
    ]
  },
  plugins: [
    new HTMLWebpackPlugin({
      inject: "head",
      scriptLoading: "blocking",
      // Contains arbitrary code used to test the app
      template: "./src/public/test-page.html"
    })
  ]
})
