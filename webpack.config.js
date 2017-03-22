/**
 * External dependencies
 */

const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );

/**
 * Base path from which modules are to be discovered.
 *
 * @type {String}
 */
const BASE_PATH = './modules';

/**
 * Object of Webpack entry points consisting of modules discovered in the base
 * path subdirectory. Treating each as an independent bundle with a shared
 * configuration for library output provides a consistent authoring environment
 * and exposes each separately on the global scope (window.wp.blocks, etc.).
 *
 * @type {Object}
 */
const entry = fs.readdirSync( BASE_PATH ).reduce( ( memo, filename ) => {
	if ( '.' !== filename && '..' !== filename ) {
		memo[ filename ] = BASE_PATH + '/' + filename + '/index.js';
	}

	return memo;
}, {} );

/**
 * Whether build output should be configured to optimize for distribution.
 *
 * @type {Boolean}
 */
const isProduction = ( 'production' === process.env.NODE_ENV );

const config = {
	entry: entry,
	output: {
		filename: '[name]/build/index.js',
		path: path.resolve( BASE_PATH ),
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this'
	},
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM'
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: 'babel-loader'
			},
			{
				test: /\.s?css$/,
				use: ExtractTextPlugin.extract( {
					use: [
						{ loader: 'raw-loader' },
						{ loader: 'postcss-loader' },
						{
							loader: 'sass-loader',
							query: {
								outputStyle: isProduction ? 'compressed' : 'nested'
							}
						}
					]
				} )
			}
		]
	},
	plugins: [
		new ExtractTextPlugin( {
			filename: './[name]/build/style.css'
		} ),
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

if ( isProduction ) {
	config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
} else {
	config.devtool = 'source-map';
}

module.exports = config;
