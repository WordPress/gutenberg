/**
 * External dependencies
 */

const webpack = require( 'webpack' );

const config = module.exports = {
	entry: {
		app: './editor/index.js'
	},
	output: {
		filename: 'build/[name].js',
		path: __dirname
	},
	resolve: {
		modules: [
			'editor',
			'external',
			'node_modules'
		]
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: 'babel-loader'
			},
			{
				test: /\.s?css$/,
				use: [
					{ loader: 'style-loader' },
					{ loader: 'css-loader' },
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
