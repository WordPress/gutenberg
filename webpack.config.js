/**
 * External dependencies
 */

const fs = require( 'fs' );
const path = require( 'path' );
const webpack = require( 'webpack' );

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

const config = {
	entry: entry,
	output: {
		filename: '[name]/build/index.js',
		path: path.resolve( BASE_PATH ),
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this'
	},
	resolve: {
		modules: [
			...Object.keys( entry ).map( ( filename ) => {
				return path.join( BASE_PATH, filename );
			} ),
			'node_modules'
		]
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
		new webpack.DefinePlugin( {
			'process.env': {
				NODE_ENV: JSON.stringify( process.env.NODE_ENV )
			}
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

if ( 'production' === process.env.NODE_ENV ) {
	config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
} else {
	config.devtool = 'source-map';
}

module.exports = config;
