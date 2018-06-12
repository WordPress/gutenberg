/**
 * External dependencies
 */
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );

const { get } = require( 'lodash' );
const { basename, resolve } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );
const LibraryExportDefaultPlugin = require( '../packages/library-export-default-webpack-plugin' );
const PostCssWrapper = require( 'postcss-wrapper-loader' );
const StringReplacePlugin = require( 'string-replace-webpack-plugin' );

// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './css/style.css',
} );

// CSS loader for styles specific to block editing.
const editBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './css/core-blocks/edit-blocks.css',
} );

// CSS loader for styles specific to blocks in general.
const blocksCSSPlugin = new ExtractTextPlugin( {
	filename: './css/core-blocks/style.css',
} );

// CSS loader for default visual block styles.
const themeBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './css/core-blocks/theme.css',
} );

// Configuration for the ExtractTextPlugin.
const extractConfig = {
	use: [
		{ loader: 'raw-loader' },
		{
			loader: 'postcss-loader',
			options: {
				plugins: [
					require( '../packages/postcss-themes' )( {
						defaults: {
							primary: '#0085ba',
							secondary: '#11a0d2',
							toggle: '#11a0d2',
							button: '#0085ba',
						},
						themes: {
							'admin-color-light': {
								primary: '#0085ba',
								secondary: '#c75726',
								toggle: '#11a0d2',
								button: '#0085ba',
							},
							'admin-color-blue': {
								primary: '#82b4cb',
								secondary: '#d9ab59',
								toggle: '#82b4cb',
								button: '#d9ab59',
							},
							'admin-color-coffee': {
								primary: '#c2a68c',
								secondary: '#9fa47b',
								toggle: '#c2a68c',
								button: '#c2a68c',
							},
							'admin-color-ectoplasm': {
								primary: '#a7b656',
								secondary: '#c77430',
								toggle: '#a7b656',
								button: '#a7b656',
							},
							'admin-color-midnight': {
								primary: '#e14d43',
								secondary: '#77a6b9',
								toggle: '#77a6b9',
								button: '#e14d43',
							},
							'admin-color-ocean': {
								primary: '#a3b9a2',
								secondary: '#a89d8a',
								toggle: '#a3b9a2',
								button: '#a3b9a2',
							},
							'admin-color-sunrise': {
								primary: '#d1864a',
								secondary: '#c8b03c',
								toggle: '#c8b03c',
								button: '#d1864a',
							},
						},
					} ),
					require( 'autoprefixer' ),
					require( 'postcss-color-function' ),
				],
			},
		},
		{
			loader: 'sass-loader',
			query: {
				includePaths: [ 'edit-post/assets/stylesheets' ],
				data: '@import "colors"; @import "breakpoints"; @import "variables"; @import "mixins"; @import "animations";@import "z-index";',
				outputStyle: 'production' === process.env.NODE_ENV ?
					'compressed' : 'nested',
			},
		},
	],
};

const dirname = resolve();

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
	'editor',
	'utils',
	'viewport',
	'plugins',
	'edit-post',
	'core-blocks',
	'nux',
];

const gutenbergPackages = [
	'blob',
	'data',
	'date',
	'deprecated',
	'dom',
	'element',
	'core-data',
];

const coreGlobals = [
	'api-request',
	'url',
];

const externals = {};

const alias = {};

entryPointNames.forEach( ( name ) => {
	alias[ '@wordpress/' + name ] = `${ dirname }/${ name }`;
} );

gutenbergPackages.forEach( ( name ) => {
	alias[ '@wordpress/' + name ] = `${ dirname }/packages/${ name }`;
} );

// make them external global vars
[
	...coreGlobals,
	// ...gutenbergPackages,
].forEach( ( name ) => {
	externals[ `@wordpress/${ name }` ] = {
		this: [ 'wp', camelCaseDash( name ) ],
	};
} );

const config = {
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

	entry: `${ dirname }/gutenberg-package/src/js/index.js`,
	output: {
		filename: 'js/gutenberg.js',
		path: `${ dirname }/gutenberg-package/build`,
		libraryTarget: 'this',
	},
	externals,
	resolve: {
		modules: [
			dirname,
			'node_modules',
		],
		alias: {
			...alias,
		},
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
					/core-blocks/,
				],
				use: blocksCSSPlugin.extract( extractConfig ),
			},
			{
				test: /editor\.s?css$/,
				include: [
					/core-blocks/,
				],
				use: editBlocksCSSPlugin.extract( {
					use: [
						...extractConfig.use,
						{
							// remove .gutenberg class in editor.scss files
							loader: StringReplacePlugin.replace( {
								replacements: [ {
									pattern: /.gutenberg /ig,
									replacement: () => ( '' ),
								} ],
							} ),
						},
					],
				} ),
			},
			{
				test: /theme\.s?css$/,
				include: [
					/core-blocks/,
				],
				use: themeBlocksCSSPlugin.extract( extractConfig ),
			},
			{
				test: /\.s?css$/,
				exclude: [
					/core-blocks/,
				],
				use: mainCSSExtractTextPlugin.extract( extractConfig ),
			},
			{
				test: /\.s?css$/,
				include: [
					/packages\/gutenberg\/src/,
				],
				use: [
					{ loader: 'sass-loader' }, // compiles Sass to CSS
				],
			},
		],
	},
	plugins: [
		blocksCSSPlugin,
		editBlocksCSSPlugin,
		themeBlocksCSSPlugin,
		mainCSSExtractTextPlugin,
		// wrapping editor style with .gutenberg__editor class
		new PostCssWrapper( './css/core-blocks/edit-blocks.css', '.gutenberg__editor' ),
		new StringReplacePlugin(),
		// Create RTL files with a -rtl suffix
		new WebpackRTLPlugin( {
			suffix: '-rtl',
			minify: process.env.NODE_ENV === 'production' ? { safe: true } : false,
		} ),
		new CustomTemplatedPathPlugin( {
			basename( path, data ) {
				let rawRequest;

				const entryModule = get( data, [ 'chunk', 'entryModule' ], {} );
				switch ( entryModule.type ) {
					case 'javascript/auto':
						rawRequest = entryModule.rawRequest;
						break;

					case 'javascript/esm':
						rawRequest = entryModule.rootModule.rawRequest;
						break;
				}

				if ( rawRequest ) {
					return basename( rawRequest );
				}

				return path;
			},
		} ),
		new LibraryExportDefaultPlugin( [ 'deprecated', 'dom-ready' ].map( camelCaseDash ) ),
	],
	stats: {
		children: false,
	},
};

if ( config.mode !== 'production' ) {
	config.devtool = process.env.SOURCEMAP || 'source-map';
}

if ( config.mode === 'development' ) {
	config.plugins.push( new LiveReloadPlugin( { port: process.env.GUTENBERG_LIVE_RELOAD_PORT || 35729 } ) );
}

module.exports = config;
