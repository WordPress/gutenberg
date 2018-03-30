/**
 * External dependencies
 */
const webpack = require( 'webpack' );
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const { reduce, escapeRegExp, get } = require( 'lodash' );
const { basename } = require( 'path' );

// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './[basename]/build/style.css',
} );

// CSS loader for styles specific to block editing.
const editBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/build/edit-blocks.css',
} );

// CSS loader for styles specific to blocks in general.
const blocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/build/style.css',
} );

// Configuration for the ExtractTextPlugin.
const extractConfig = {
	use: [
		{ loader: 'raw-loader' },
		{
			loader: 'postcss-loader',
			options: {
				plugins: [
					require( 'autoprefixer' ),
				],
			},
		},
		{
			loader: 'sass-loader',
			query: {
				includePaths: [ 'edit-post/assets/stylesheets' ],
				data: '@import "colors"; @import "admin-schemes"; @import "breakpoints"; @import "variables"; @import "mixins"; @import "animations";@import "z-index";',
				outputStyle: 'production' === process.env.NODE_ENV ?
					'compressed' : 'nested',
			},
		},
	],
};

/**
 * Given a string, returns a new string with dash separators converedd to
 * camel-case equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will convert letters following
 * numbers.
 *
 * @param {string} string Input dash-delimited string.
 *
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace(
		/-([a-z])/,
		( match, letter ) => letter.toUpperCase()
	);
}

const entryPointNames = [
	'blocks',
	'components',
	'date',
	'editor',
	'element',
	'i18n',
	'utils',
	'data',
	'viewport',
	'core-data',
	'plugins',
	'edit-post',
];

const packageNames = [
	'hooks',
];

const coreGlobals = [
	'api-request',
];

const externals = {
	react: 'React',
	'react-dom': 'ReactDOM',
	tinymce: 'tinymce',
	moment: 'moment',
	jquery: 'jQuery',
};

[
	...entryPointNames,
	...packageNames,
	...coreGlobals,
].forEach( ( name ) => {
	externals[ `@wordpress/${ name }` ] = {
		this: [ 'wp', camelCaseDash( name ) ],
	};
} );

/**
 * Webpack plugin for handling specific template tags in Webpack configuration
 * values like those supported in the base Webpack functionality (e.g. `name`).
 *
 * @see webpack.TemplatedPathPlugin
 */
class CustomTemplatedPathPlugin {
	/**
	 * CustomTemplatedPathPlugin constructor. Initializes handlers as a tuple
	 * set of RegExp, handler, where the regular expression is used in matching
	 * a Webpack asset path.
	 *
	 * @param {Object.<string,Function>} handlers Object keyed by tag to match,
	 *                                            with function value returning
	 *                                            replacement string.
	 *
	 * @return {void}
	 */
	constructor( handlers ) {
		this.handlers = reduce( handlers, ( result, handler, key ) => {
			const regexp = new RegExp( `\\[${ escapeRegExp( key ) }\\]`, 'gi' );
			return [ ...result, [ regexp, handler ] ];
		}, [] );
	}

	/**
	 * Webpack plugin application logic.
	 *
	 * @param {Object} compiler Webpack compiler
	 *
	 * @return {void}
	 */
	apply( compiler ) {
		compiler.plugin( 'compilation', ( compilation ) => {
			compilation.mainTemplate.plugin( 'asset-path', ( path, data ) => {
				for ( let i = 0; i < this.handlers.length; i++ ) {
					const [ regexp, handler ] = this.handlers[ i ];
					if ( regexp.test( path ) ) {
						return path.replace( regexp, handler( path, data ) );
					}
				}

				return path;
			} );
		} );
	}
}

const config = {
	entry: Object.assign(
		entryPointNames.reduce( ( memo, path ) => {
			const name = camelCaseDash( path );
			memo[ name ] = `./${ path }`;
			return memo;
		}, {} ),
		packageNames.reduce( ( memo, packageName ) => {
			memo[ packageName ] = `./node_modules/@wordpress/${ packageName }`;
			return memo;
		}, {} )
	),
	output: {
		filename: '[basename]/build/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},
	externals,
	resolve: {
		modules: [
			__dirname,
			'node_modules',
		],
	},
	module: {
		rules: [
			{
				test: /\.pegjs/,
				use: 'pegjs-loader',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: 'babel-loader',
			},
			{
				test: /style\.s?css$/,
				include: [
					/blocks/,
				],
				use: blocksCSSPlugin.extract( extractConfig ),
			},
			{
				test: /editor\.s?css$/,
				include: [
					/blocks/,
				],
				use: editBlocksCSSPlugin.extract( extractConfig ),
			},
			{
				test: /\.s?css$/,
				exclude: [
					/blocks/,
				],
				use: mainCSSExtractTextPlugin.extract( extractConfig ),
			},
		],
	},
	plugins: [
		new webpack.DefinePlugin( {
			'process.env.NODE_ENV': JSON.stringify( process.env.NODE_ENV || 'development' ),
		} ),
		blocksCSSPlugin,
		editBlocksCSSPlugin,
		mainCSSExtractTextPlugin,
		// Create RTL files with a -rtl suffix
		new WebpackRTLPlugin( {
			suffix: '-rtl',
			minify: process.env.NODE_ENV === 'production' ? { safe: true } : false,
		} ),
		new webpack.LoaderOptionsPlugin( {
			minimize: process.env.NODE_ENV === 'production',
			debug: process.env.NODE_ENV !== 'production',
		} ),
		new CustomTemplatedPathPlugin( {
			basename( path, data ) {
				const rawRequest = get( data, [ 'chunk', 'entryModule', 'rawRequest' ] );
				if ( rawRequest ) {
					return basename( rawRequest );
				}

				return path;
			},
		} ),
	],
	stats: {
		children: false,
	},
};

switch ( process.env.NODE_ENV ) {
	case 'production':
		config.plugins.push( new webpack.optimize.UglifyJsPlugin() );
		break;

	default:
		config.devtool = 'source-map';
}

module.exports = config;
