/**
 * External dependencies
 */
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );

const { get } = require( 'lodash' );
const { basename } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );

// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './build/[basename]/style.css',
} );

// CSS loader for styles specific to block editing.
const editBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './build/core-blocks/edit-blocks.css',
} );

// CSS loader for styles specific to blocks in general.
const blocksCSSPlugin = new ExtractTextPlugin( {
	filename: './build/core-blocks/style.css',
} );

// CSS loader for default visual block styles.
const themeBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './build/core-blocks/theme.css',
} );

// Configuration for the ExtractTextPlugin.
const extractConfig = {
	use: [
		{ loader: 'raw-loader' },
		{
			loader: 'postcss-loader',
			options: {
				plugins: require( './bin/packages/post-css-config' ),
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
		/-([a-z])/g,
		( match, letter ) => letter.toUpperCase()
	);
}

const entryPointNames = [
	'blocks',
	'components',
	'editor',
	'utils',
	'edit-post',
	'core-blocks',
	'nux',
];

if ( process.env.GUTENBERG_ENV === 'standalone' ) {
	entryPointNames.push( 'standalone' );
}

const gutenbergPackages = [
	'a11y',
	'api-fetch',
	'blob',
	'block-serialization-spec-parser',
	'compose',
	'core-data',
	'data',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'element',
	'hooks',
	'html-entities',
	'i18n',
	'is-shallow-equal',
	'keycodes',
	'plugins',
	'shortcode',
	'viewport',
];

const externals = {
	react: 'React',
	'react-dom': 'ReactDOM',
	tinymce: 'tinymce',
	moment: 'moment',
	jquery: 'jQuery',
	lodash: 'lodash',
	'lodash-es': 'lodash',
};

[
	...entryPointNames,
	...gutenbergPackages,
].forEach( ( name ) => {
	externals[ `@wordpress/${ name }` ] = {
		this: [ 'wp', camelCaseDash( name ) ],
	};
} );

const config = {
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

	entry: Object.assign(
		entryPointNames.reduce( ( memo, path ) => {
			const name = camelCaseDash( path );
			memo[ name ] = `./${ path }`;
			return memo;
		}, {} ),
		gutenbergPackages.reduce( ( memo, packageName ) => {
			const name = camelCaseDash( packageName );
			memo[ name ] = `./packages/${ packageName }`;
			return memo;
		}, {} ),
	),
	output: {
		filename: './build/[basename]/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'window', // TODO can't merge with this value. `this` is undefined in "use strict". So this.wp will throw an error from the browser context
	},
	externals,
	resolve: {
		modules: [
			__dirname,
			'node_modules',
		],
		alias: {
			'lodash-es': 'lodash',
		},
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				exclude: [
					/block-serialization-spec-parser/,
					/node_modules/,
				],
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
				use: editBlocksCSSPlugin.extract( extractConfig ),
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
		],
	},
	plugins: [
		blocksCSSPlugin,
		editBlocksCSSPlugin,
		themeBlocksCSSPlugin,
		mainCSSExtractTextPlugin,
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
		new LibraryExportDefaultPlugin( [
			'api-fetch',
			'deprecated',
			'dom-ready',
			'is-shallow-equal',
		].map( camelCaseDash ) ),
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

//Experimental Standalone Sandbox!
if ( process.env.GUTENBERG_ENV === 'standalone' ) {
	const CleanWebpackPlugin = require( 'clean-webpack-plugin' );
	const HtmlWebpackPlugin = require( 'html-webpack-plugin' );
	config.plugins.push( new CleanWebpackPlugin( [ 'build/standalone' ], { verbose: true } ) );
	config.plugins.push( new HtmlWebpackPlugin( { template: './standalone/index.html' } ) );
	config.devServer = {
		contentBase: './build/standalone',
	};
	config.devtool = 'source-map';
	config.externals = [];
	const path = require( 'path' );
	const alias = Object.assign( {}, config.resolve.alias, {
		'@wordpress/core-blocks': path.resolve( __dirname, 'build/core-blocks' ),
		'@wordpress/editor': path.resolve( __dirname, 'build/editor' ),
		'@wordpress/components': path.resolve( __dirname, 'build/components' ),
		'@wordpress/viewports': path.resolve( __dirname, 'build/viewports' ),
		'@wordpress/blocks': path.resolve( __dirname, 'build/blocks' ),

	} );
	config.resolve.alias = alias;
}

module.exports = config;
