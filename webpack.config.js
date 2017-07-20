module.exports = {
  entry: './packages/hooks/src/wp-hooks.js',
  output: {
    filename: './packages/hooks/build/wp-core/wp-hooks.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  }

}
