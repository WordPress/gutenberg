/**
 * External dependencies
 */
const { DefinePlugin } = require( 'webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const postcss = require( 'postcss' );
const { get, escapeRegExp } = require( 'lodash' );
const { basename, sep } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );
const defaultConfig = require( '@wordpress/scripts/config/webpack.config' );
const { camelCaseDash } = require( '@wordpress/scripts/utils' );

/**
 * Internal dependencies
 */
const { dependencies } = require( './package' );

const WORDPRESS_NAMESPACE = '@wordpress/';

const gutenbergPackages = Object.keys( dependencies )
	.filter( ( packageName ) => packageName.startsWith( WORDPRESS_NAMESPACE ) )
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

module.exports = {
	...defaultConfig,
	entry: gutenbergPackages.reduce( ( memo, packageName ) => {
		const name = camelCaseDash( packageName );
		memo[ name ] = `./packages/${ packageName }`;
		return memo;
	}, {} ),
	output: {
		filename: './build/[basename]/index.js',
		path: __dirname,
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},
	// Despite being empty, this must exist as an entry to override the default
	// configuration. Gutenberg does not inherit the same Webpack rules as in
	// the default. Notably, it does not require Babel processing because the
	// files are transpiled by `npm run build:packages` before being processed
	// by Webpack.
	module: {},
	plugins: [
		...defaultConfig.plugins,
		new DefinePlugin( {
			// Inject the `GUTENBERG_PHASE` global, used for feature flagging.
			// eslint-disable-next-line @wordpress/gutenberg-phase
			'process.env.GUTENBERG_PHASE': JSON.stringify( parseInt( process.env.npm_package_config_GUTENBERG_PHASE, 10 ) || 1 ),
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
			'shortcode',
		].map( camelCaseDash ) ),
		new CopyWebpackPlugin(
			gutenbergPackages.map( ( packageName ) => ( {
				from: `./packages/${ packageName }/build-style/*.css`,
				to: `./build/${ packageName }/`,
				flatten: true,
				transform: ( content ) => {
					if ( defaultConfig.mode === 'production' ) {
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
	],
};
