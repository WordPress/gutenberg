/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const { DefinePlugin } = require( 'webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const postcss = require( 'postcss' );
const { get, escapeRegExp, compact } = require( 'lodash' );
const { basename, sep } = require( 'path' );

/**
 * WordPress dependencies
 */
const CustomTemplatedPathPlugin = require( '@wordpress/custom-templated-path-webpack-plugin' );
const LibraryExportDefaultPlugin = require( '@wordpress/library-export-default-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const {
	camelCaseDash,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );

/**
 * Internal dependencies
 */
const { dependencies } = require( './package' );

const {
	NODE_ENV: mode = 'development',
	WP_DEVTOOL: devtool = mode === 'production' ? false : 'source-map',
} = process.env;

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [ '@wordpress/icons', '@wordpress/interface' ];

const gutenbergPackages = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' )
	)
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

const stylesTransform = ( content ) => {
	if ( mode === 'production' ) {
		return postcss( [
			require( 'cssnano' )( {
				preset: [
					'default',
					{
						discardComments: {
							removeAll: true,
						},
					},
				],
			} ),
		] )
			.process( content, {
				from: 'src/app.css',
				to: 'dest/app.css',
			} )
			.then( ( result ) => result.css );
	}
	return content;
};

module.exports = {
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		concatenateModules:
			mode === 'production' && ! process.env.WP_BUNDLE_ANALYZER,
		minimizer: [
			new TerserPlugin( {
				cache: true,
				parallel: true,
				sourceMap: mode !== 'production',
				terserOptions: {
					output: {
						comments: /translators:/i,
					},
					compress: {
						passes: 2,
					},
					mangle: {
						reserved: [ '__', '_n', '_nx', '_x' ],
					},
				},
				extractComments: false,
			} ),
		],
	},
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
		libraryTarget: 'window',
	},
	module: {
		rules: compact( [
			mode !== 'production' && {
				test: /\.js$/,
				use: require.resolve( 'source-map-loader' ),
				enforce: 'pre',
			},
		] ),
	},
	plugins: [
		// The WP_BUNDLE_ANALYZER global variable enables a utility that represents bundle
		// content as a convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		new DefinePlugin( {
			// Inject the `GUTENBERG_PHASE` global, used for feature flagging.
			'process.env.GUTENBERG_PHASE': JSON.stringify(
				parseInt(
					process.env.npm_package_config_GUTENBERG_PHASE,
					10
				) || 1
			),
			// Inject the `COMPONENT_SYSTEM_PHASE` global, used for controlling Component System roll-out.
			'process.env.COMPONENT_SYSTEM_PHASE': JSON.stringify(
				parseInt(
					process.env.npm_package_config_COMPONENT_SYSTEM_PHASE,
					10
				) || 0
			),
			'process.env.FORCE_REDUCED_MOTION': JSON.stringify(
				process.env.FORCE_REDUCED_MOTION
			),
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
		new LibraryExportDefaultPlugin(
			[
				'api-fetch',
				'deprecated',
				'dom-ready',
				'redux-routine',
				'token-list',
				'server-side-render',
				'shortcode',
				'warning',
			].map( camelCaseDash )
		),
		new CopyWebpackPlugin(
			gutenbergPackages.map( ( packageName ) => ( {
				from: `./packages/${ packageName }/build-style/*.css`,
				to: `./build/${ packageName }/`,
				flatten: true,
				transform: stylesTransform,
			} ) )
		),
		new CopyWebpackPlugin( [
			{
				from: './packages/block-library/build-style/*/style.css',
				test: new RegExp(
					`([\\w-]+)${ escapeRegExp( sep ) }style\\.css$`
				),
				to: 'build/block-library/blocks/[1]/style.css',
				transform: stylesTransform,
			},
			{
				from: './packages/block-library/build-style/*/style-rtl.css',
				test: new RegExp(
					`([\\w-]+)${ escapeRegExp( sep ) }style-rtl\\.css$`
				),
				to: 'build/block-library/blocks/[1]/style-rtl.css',
				transform: stylesTransform,
			},
			{
				from: './packages/block-library/build-style/*/editor.css',
				test: new RegExp(
					`([\\w-]+)${ escapeRegExp( sep ) }editor\\.css$`
				),
				to: 'build/block-library/blocks/[1]/editor.css',
				transform: stylesTransform,
			},
			{
				from: './packages/block-library/build-style/*/editor-rtl.css',
				test: new RegExp(
					`([\\w-]+)${ escapeRegExp( sep ) }editor-rtl\\.css$`
				),
				to: 'build/block-library/blocks/[1]/editor-rtl.css',
				transform: stylesTransform,
			},
		] ),
		new CopyWebpackPlugin(
			Object.entries( {
				'./packages/block-library/src/': 'build/block-library/blocks/',
				'./packages/edit-widgets/src/blocks/':
					'build/edit-widgets/blocks/',
			} ).flatMap( ( [ from, to ] ) => [
				{
					from: `${ from }/**/index.php`,
					test: new RegExp(
						`([\\w-]+)${ escapeRegExp( sep ) }index\\.php$`
					),
					to: `${ to }/[1].php`,
					transform: ( content ) => {
						content = content.toString();

						// Within content, search for any function definitions. For
						// each, replace every other reference to it in the file.
						return (
							content
								.match( /^function [^\(]+/gm )
								.reduce( ( result, functionName ) => {
									// Trim leading "function " prefix from match.
									functionName = functionName.slice( 9 );

									// Prepend the Gutenberg prefix, substituting any
									// other core prefix (e.g. "wp_").
									return result.replace(
										new RegExp( functionName, 'g' ),
										( match ) =>
											'gutenberg_' +
											match.replace( /^wp_/, '' )
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
								.replace(
									/(add_action\(\s*'init',\s*'gutenberg_register_block_[^']+'(?!,))/,
									'$1, 20'
								)
						);
					},
				},
				{
					from: `${ from }/*/block.json`,
					test: new RegExp(
						`([\\w-]+)${ escapeRegExp( sep ) }block\\.json$`
					),
					to: `${ to }/[1]/block.json`,
				},
			] )
		),
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
	].filter( Boolean ),
	watchOptions: {
		ignored: '!packages/*/build-module/**/*',
		aggregateTimeout: 500,
	},
	devtool,
};
