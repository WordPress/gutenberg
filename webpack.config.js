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
		const submodule = BASE_PATH + '/' + filename;
		memo[ filename ] = submodule + '/' + require( submodule + '/package' ).module;
	}

	return memo;
}, {} );

const config = module.exports = {
	entry: entry,
	output: {
		filename: '[name]/build/index.js',
		path: path.resolve( BASE_PATH ),
		library: [ 'wp', '[name]' ],
		libraryTarget: 'umd2'
	},
	resolve: {
		modules: [
			'editor',
			'external',
			'node_modules'
		]
	},
	externals: Object.keys( entry ).reduce( ( memo, filename ) => {
		const name = require( BASE_PATH + '/' + filename + '/package' ).name;
		memo[ name ] = { 'this': [ 'wp', filename ] };
		return memo;
	}, {} ),
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
