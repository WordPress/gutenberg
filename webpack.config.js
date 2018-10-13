/**
 * External dependencies
 */
const ExtractTextPlugin = require( 'extract-text-webpack-plugin' );
const WebpackRTLPlugin = require( 'webpack-rtl-plugin' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const postcss = require( 'postcss' );

const { get } = require( 'lodash' );
const { basename } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );

// Main CSS loader for everything but blocks..
const mainCSSExtractTextPlugin = new ExtractTextPlugin( {
	filename: './build/[basename]/style.css',
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
				includePaths: [ 'assets/stylesheets' ],
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
	'components',
];

const gutenbergPackages = [
	'a11y',
	'api-fetch',
	'autop',
	'blob',
	'blocks',
	'block-library',
	'block-serialization-default-parser',
	'block-serialization-spec-parser',
	'compose',
	'core-data',
	'data',
	'date',
	'deprecated',
	'dom',
	'dom-ready',
	'edit-post',
	'editor',
	'element',
	'escape-html',
	'format-library',
	'hooks',
	'html-entities',
	'i18n',
	'is-shallow-equal',
	'keycodes',
	'list-reusable-blocks',
	'nux',
	'plugins',
	'redux-routine',
	'rich-text',
	'shortcode',
	'token-list',
	'url',
	'viewport',
	'wordcount',
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

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const config = {
	mode,
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
		libraryTarget: 'this',
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
				use: [ 'source-map-loader' ],
				enforce: 'pre',
			},
			{
				test: /\.js$/,
				exclude: [
					/block-serialization-spec-parser/,
					/is-shallow-equal/,
					/node_modules/,
				],
				use: 'babel-loader',
			},
			{
				test: /\.s?css$/,
				use: mainCSSExtractTextPlugin.extract( extractConfig ),
			},
		],
	},
	plugins: [
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
			'redux-routine',
		].map( camelCaseDash ) ),
		new CopyWebpackPlugin(
			gutenbergPackages.map( ( packageName ) => ( {
				from: `./packages/${ packageName }/build-style/*.css`,
				to: `./build/${ packageName }/`,
				flatten: true,
				transform: ( content ) => {
					if ( config.mode === 'production' ) {
						return postcss( [
							require( 'cssnano' )( {
								preset: 'default',
							} ),
						] )
							.process( content, { from: 'src/app.css', to: 'dest/app.css' } )
							.then( ( result ) => result.css );
					}
					return content;
				},
			} ) )
		),
		// GUTENBERG_BUNDLE_ANALYZER global variable enables utility that represents bundle content
		// as convenient interactive zoomable treemap.
		process.env.GUTENBERG_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// GUTENBERG_LIVE_RELOAD_PORT global variable changes port on which live reload works
		// when running watch mode.
		! isProduction && new LiveReloadPlugin( { port: process.env.GUTENBERG_LIVE_RELOAD_PORT || 35729 } ),
	].filter( Boolean ),
	stats: {
		children: false,
	},
};

if ( ! isProduction ) {
	// GUTENBERG_DEVTOOL global variable controls how source maps are generated.
	// See: https://webpack.js.org/configuration/devtool/#devtool.
	config.devtool = process.env.GUTENBERG_DEVTOOL || 'source-map';
}

module.exports = config;
