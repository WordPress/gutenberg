/**
 * External dependencies
 */

const webpack = require( 'webpack' );

const config = module.exports = {
	entry: {
		app: './src/index.js'
	},
	output: {
		filename: 'build/[name].js',
		path: __dirname
	},
	resolve: {
		modules: [
			'src',
			'src/external',
			'node_modules'
		]
	},
	externals: [
		'tinymce'
	],
	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader'
			},
			{
				test: /\.s?css$/,
				use: [{ loader: 'style-loader' },
				{
					loader: 'css-loader',
					query: {
						modules: true,
						localIdentName: '[name]__[local]___[hash:base64:5]',
						sourceMap: true
					}
				},
				{ loader: 'postcss-loader' },
				{ loader: 'sass-loader' }
				]
			}
		]
	},
	plugins: [
		new webpack.LoaderOptionsPlugin( {
			minimize: process.env.NODE_ENV === 'production',
			debug: process.env.NODE_ENV !== 'production',
			options: {
				postcss: [
					require( 'autoprefixer' )
				]
			}
		} )
	]
};

if ( 'production' === process.env.NODE_ENV ) {
	config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
} else {
	config.devtool = 'source-map';
}
