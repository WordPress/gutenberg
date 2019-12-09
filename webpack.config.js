/**
 * External dependencies
 */
const { DefinePlugin } = require( 'webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const postcss = require( 'postcss' );
const { get, escapeRegExp, compact } = require( 'lodash' );
const { basename, sep } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const { camelCaseDash } = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const { dependencies } = require( './package' );

const {
	NODE_ENV: mode = 'development',
	WP_DEVTOOL: devtool = ( mode === 'production' ? false : 'source-map' ),
} = process.env;

const WORDPRESS_NAMESPACE = '@wordpress/';

const gutenbergPackages = Object.keys( dependencies )
	.filter( ( packageName ) => packageName.startsWith( WORDPRESS_NAMESPACE ) )
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

module.exports = {
	mode,
	entry: gutenbergPackages.reduce( ( memo, packageName ) => {
		const name = camelCaseDash( packageName );
		memo[ name ] = `./packages/${ packageName }`;
		return memo;
	}, {} ),
	output: {
		devtoolNamespace: 'wp',
		filename: './build/[basename]/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},
	module: {
		rules: compact( [
			mode !== 'production' && {
				test: /\.js$/,
				use: require.resolve( 'source-map-loader' ),
				enforce: 'pre',
			},
			{
				test: /\.js$/,
				include: /node_modules/,
				exclude: /@babel(?:\/|\\{1,2})runtime/,
				use: [
					require.resolve( 'thread-loader' ),
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory: process.env.BABEL_CACHE_DIRECTORY || true,
							babelrc: false,
							configFile: false,
							presets: [
								[
									require.resolve( '@babel/preset-env' ),
									{

										// don't transform import statements so webpack can perform treeshaking
										modules: false,

										useBuiltIns: 'entry',
										corejs: 3,

										// perform the minimum transforms for the targetted platforms
										targets: {
											node: mode === 'development' ? 'current' : undefined,
											browsers: mode === 'production' ? require( '@wordpress/browserslist-config' ) : undefined,
										},

										// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
										exclude: [ 'transform-typeof-symbol' ],

									},
								],
							],
							plugins: [

								// avoid duplication of helper functions by relying on a runtime
								[
									require.resolve( '@babel/plugin-transform-runtime' ),
									{
										corejs: false,
										helpers: true,
										regenerator: true,
										useESModules: true,
									},
								],

								// support use of dynamic import()s
								require.resolve( '@babel/plugin-syntax-dynamic-import' ),

							],
							sourceMaps: true,
							inputSourceMap: true,
						},
					},
				],
			},
		] ),
	},
	plugins: [
		new DefinePlugin( {
			// Inject the `GUTENBERG_PHASE` global, used for feature flagging.
			'process.env.GUTENBERG_PHASE': JSON.stringify( parseInt( process.env.npm_package_config_GUTENBERG_PHASE, 10 ) || 1 ),
			'process.env.FORCE_REDUCED_MOTION': JSON.stringify( process.env.FORCE_REDUCED_MOTION ),
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
			'token-list',
			'server-side-render',
			'shortcode',
		].map( camelCaseDash ) ),
		new CopyWebpackPlugin(
			gutenbergPackages.map( ( packageName ) => ( {
				from: `./packages/${ packageName }/build-style/*.css`,
				to: `./build/${ packageName }/`,
				flatten: true,
				transform: ( content ) => {
					if ( mode === 'production' ) {
						return postcss( [
							require( 'cssnano' )( {
								preset: [ 'default', {
									discardComments: {
										removeAll: true,
									},
								} ],
							} ),
						] )
							.process( content, { from: 'src/app.css', to: 'dest/app.css' } )
							.then( ( result ) => result.css );
					}
					return content;
				},
			} ) )
		),
		new CopyWebpackPlugin( [
			{
				from: './packages/block-library/src/**/index.php',
				test: new RegExp( `([\\w-]+)${ escapeRegExp( sep ) }index\\.php$` ),
				to: 'build/block-library/blocks/[1].php',
				transform( content ) {
					content = content.toString();

					// Within content, search for any function definitions. For
					// each, replace every other reference to it in the file.
					return content
						.match( /^function [^\(]+/gm )
						.reduce( ( result, functionName ) => {
							// Trim leading "function " prefix from match.
							functionName = functionName.slice( 9 );

							// Prepend the Gutenberg prefix, substituting any
							// other core prefix (e.g. "wp_").
							return result.replace(
								new RegExp( functionName, 'g' ),
								( match ) => 'gutenberg_' + match.replace( /^wp_/, '' )
							);
						}, content )
						// The core blocks override procedure takes place in
						// the init action default priority to ensure that core
						// blocks would have been registered already. Since the
						// blocks implementations occur at the default priority
						// and due to WordPress hooks behavior not considering
						// mutations to the same priority during another's
						// callback, the Gutenberg build blocks are modified
						// to occur at a later priority.
						.replace( /(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/, '$1, 20' );
				},
			},
		] ),
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
	],
	devtool,
};
