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

const config = {
	entry: {
		blocks: BASE_PATH + '/blocks/index.js',
		editor: BASE_PATH + '/editor/index.js',
		element: BASE_PATH + '/element/index.js'
	},
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
				include: [
					__dirname + '/modules',
					__dirname + '/node_modules/hpq'
				],
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
		config.target = 'node';
		config.entry = glob.sync( BASE_PATH + '/**/test/*.js' );
		config.externals = [ require( 'webpack-node-externals' )() ];
		config.output = {
			filename: 'build/test.js',
			path: __dirname
		};
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
