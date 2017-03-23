/**
 * External dependencies
 */

const glob = require( 'glob' );
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
const entry = glob.sync( `${ BASE_PATH }/*/index.js` ).reduce( ( memo, filename ) => {
	const parent = path.relative( BASE_PATH, path.dirname( filename ) );
	memo[ parent ] = filename;
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
	externals: {
		react: 'React',
		'react-dom': 'ReactDOM'
	},
	module: {
		rules: [
			{
				test: /\.pegjs/,
				use: 'pegjs-loader'
			},
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
								outputStyle: 'production' === process.env.NODE_ENV ?
									'compressed' : 'nested'
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

switch ( process.env.NODE_ENV ) {
	case 'production':
		config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
		break;

	case 'test':
		config.entry = [
			'./bootstrap-test.js',
			...glob.sync( BASE_PATH + '/**/test/*.js' )
		];
		config.output = {
			filename: 'build/test.js',
			path: __dirname
		};
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
