const path = require("path");

module.exports = {
  entry: path.join(__dirname, "index.jsx"),
  output: {
    path: path.join(__dirname, "build"),
    filename: "[name].js"
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          {
            loader: "css-loader",
            options: {
              root: "https://wordpress.com"
            }
          },
          {
            loader: "postcss-loader",
            options: {
              plugins: () => [autoprefixer({ browsers: "last 2 versions" })]
            }
          },
          {
            loader: "sass-loader",
            options: {
              fallback: "style-loader",
              use: [
                {
                  loader: "css-loader",
                  options: {
                    root: "https://wordpress.com"
                  }
                },
                {
                  loader: "postcss-loader",
                  options: {
                    plugins: () => [autoprefixer({ browsers })]
                  }
                },
                {
                  loader: "sass-loader",
                  options: {
                    includePaths: [
                      path.resolve(__dirname, "client"),
                      path.resolve(
                        __dirname,
                        "node_modules",
                        "wp-calypso",
                        "client"
                      ),
                      path.resolve(
                        __dirname,
                        "node_modules",
                        "wp-calypso",
                        "client",
                        "extensions"
                      ),
                      path.resolve(
                        __dirname,
                        "node_modules",
                        "wp-calypso",
                        "assets",
                        "stylesheets"
                      )
                    ]
                  }
                }
              ]
            }
          }
        ]
      },
      {
        test: /\.jsx?$/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              [
                "env",
                {
                  useBuiltIns: true,
                  targets: {
                    browsers: "last 2 versions, not ie_mob 10, not ie 10"
                  },
                  loose: true
                }
              ],
              "react",
              "stage-2"
            ],
            babelrc: false
          }
        },
        include: [
          __dirname,
          path.join(__dirname, "node_modules", "wp-calypso", "client")
        ]
      }
    ]
  },
  resolve: {
    extensions: [".json", ".jsx", ".js"],
    modules: [
      path.join(__dirname, "node_modules"),
      path.join(__dirname, "node_modules", "wp-calypso"),
      path.join(__dirname, "node_modules", "wp-calypso", "client"),
      path.join(__dirname, "node_modules", "wp-calypso", "node_modules")
    ],
    symlinks: false
  }
};
