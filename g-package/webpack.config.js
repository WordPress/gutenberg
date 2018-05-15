/**
 * External dependencies
 */
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const { get } = require( 'lodash' );
const { basename, resolve } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );

// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './style.css',
} );

// CSS loader for styles specific to block editing.
const editBlocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/edit-blocks.css',
} );

// CSS loader for styles specific to blocks in general.
const blocksCSSPlugin = new ExtractTextPlugin( {
	filename: './blocks/style.css',
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
	'element',
	'utils',
	'data',
	'viewport',
	'core-data',
	'plugins',
	'edit-post',
	'core-blocks',
];

const gutenbergPackages = [
	'date',
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
coreGlobals.forEach( ( name ) => {
	externals[ `@wordpress/${ name }` ] = {
		this: [ 'wp', camelCaseDash( name ) ],
	};
} );

const config = {
	mode: process.env.NODE_ENV === 'production' ? 'production' : 'development',

	entry: './index.js',
	output: {
		filename: 'gutenberg.js',
		path: `${ dirname }/g-package/dist`,
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
				use: editBlocksCSSPlugin.extract( extractConfig ),
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
	],
	stats: {
		children: false,
	},
};

if ( config.mode !== 'production' ) {
	config.devtool = process.env.SOURCEMAP || 'source-map';
}

module.exports = config;
