/**
 * External dependencies
 */
const { join, sep } = require( 'path' );
const { existsSync, readdirSync } = require( 'fs' );
const { escapeRegExp } = require( 'lodash' );
const { DefinePlugin } = require( 'webpack' );
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const threadLoader = require( 'thread-loader' );
const ForkTsCheckerWebpackPlugin = require( 'fork-ts-checker-webpack-plugin' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const RtlCssPlugin = require( 'rtlcss-webpack-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const IgnoreEmitPlugin = require( 'ignore-emit-webpack-plugin' );

/**
 * WordPress dependencies
 */
const ReadableJsAssetsWebpackPlugin = require( '@wordpress/readable-js-assets-webpack-plugin' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const {
	camelCaseDash,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );

/**
 * Internal dependencies
 */
const { dependencies } = require( '../../package.json' );

const { NODE_ENV: mode = 'development', WP_DEVTOOL: devtool } = process.env;

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [ '@wordpress/icons', '@wordpress/interface' ];

const GUTENBERG_PACKAGES = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' )
	)
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

const PROJECT_ROOT = process.cwd();

const EXPORT_DEFAULT_PACKAGES = [
	'api-fetch',
	'deprecated',
	'dom-ready',
	'redux-routine',
	'token-list',
	'server-side-render',
	'shortcode',
	'warning',
];

const BLOCK_LIBRARY_SOURCE_PATH = join(
	PROJECT_ROOT,
	'packages/block-library/src'
);

function createStyleJSEntry( importPath ) {
	return {
		import: importPath,
		filename: '[name].css-entry.js',
	};
}

function getEntries() {
	const entry = {
		'block-editor/default-editor-styles': createStyleJSEntry(
			'./packages/block-editor/src/default-editor-styles.scss'
		),
		'block-library/reset': createStyleJSEntry(
			join( BLOCK_LIBRARY_SOURCE_PATH, 'reset.scss' )
		),
		'block-library/editor': createStyleJSEntry(
			join( BLOCK_LIBRARY_SOURCE_PATH, 'editor.scss' )
		),
		'block-library/theme': createStyleJSEntry(
			join( BLOCK_LIBRARY_SOURCE_PATH, 'theme.scss' )
		),
	};

	for ( const packageName of GUTENBERG_PACKAGES ) {
		entry[ `${ packageName }/index` ] = {
			import: [ `./packages/${ packageName }` ],
			library: {
				name: [ 'wp', camelCaseDash( packageName ) ],
				type: 'window',
				export: EXPORT_DEFAULT_PACKAGES.includes( packageName )
					? 'default'
					: undefined,
			},
		};

		const stylePath = `./packages/${ packageName }/src/style.scss`;
		if ( existsSync( stylePath ) ) {
			entry[ `${ packageName }/index` ].import.unshift( stylePath );
		}
	}

	const blockNames = readdirSync( BLOCK_LIBRARY_SOURCE_PATH, {
		withFileTypes: true,
	} )
		.filter( ( dirent ) => dirent.isDirectory() )
		.map( ( dirent ) => dirent.name );

	for ( const blockName of blockNames ) {
		const scriptPath = join(
			BLOCK_LIBRARY_SOURCE_PATH,
			blockName,
			'view.js'
		);
		if ( existsSync( scriptPath ) ) {
			entry[ `block-library/blocks/${ blockName }/view` ] = scriptPath;
		}

		[ 'style', 'editor', 'theme' ].forEach( ( styleFile ) => {
			const stylePath = join(
				BLOCK_LIBRARY_SOURCE_PATH,
				blockName,
				`${ styleFile }.scss`
			);
			if ( existsSync( stylePath ) ) {
				entry[
					`block-library/blocks/${ blockName }/${ styleFile }`
				] = createStyleJSEntry( stylePath );
			}
		} );
	}

	return entry;
}

threadLoader.warmup(
	{
		poolTimeout: Infinity,
	},
	[ require.resolve( 'babel-loader' ), '@wordpress/babel-preset-default' ]
);

module.exports = {
	mode,
	devtool:
		devtool ||
		( mode === 'production' ? false : 'eval-cheap-module-source-map' ),
	target: 'browserslist',
	entry: getEntries(),
	output: {
		devtoolNamespace: 'wp',
		filename: '[name].min.js',
		path: join( PROJECT_ROOT, 'build' ),
		enabledLibraryTypes: [ 'window', 'var' ],
		pathinfo: false,
	},
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		concatenateModules:
			mode === 'production' && ! process.env.WP_BUNDLE_ANALYZER,
		minimizer: [
			new TerserPlugin( {
				parallel: true,
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
	module: {
		rules: [
			{
				test: /\.[tj]sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve( 'thread-loader' ),
						options: {
							poolTimeout: Infinity,
						},
					},
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory:
								process.env.BABEL_CACHE_DIRECTORY || true,
							cacheCompression: false,
						},
					},
				],
			},
			{
				test: /\.s[ac]ss$/,
				exclude: /node_modules/,
				use: [
					MiniCSSExtractPlugin.loader,
					{
						loader: require.resolve( 'css-loader' ),
						options: {
							sourceMap: mode !== 'production',
						},
					},
					{
						loader: require.resolve( 'postcss-loader' ),
						options: {
							postcssOptions: {
								plugins: [
									...require( '@wordpress/postcss-plugins-preset' ),
									mode === 'production' &&
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
								].filter( Boolean ),
							},
							sourceMap: mode !== 'production',
						},
					},
					{
						loader: require.resolve( 'sass-loader' ),
						options: {
							sourceMap: mode !== 'production',
							additionalData: `@use "sass:math";
@import "colors";
@import "breakpoints";
@import "variables";
@import "mixins";
@import "animations";
@import "z-index";
@import "default-custom-properties";`,
							sassOptions: {
								includePaths: [
									join(
										PROJECT_ROOT,
										'packages/base-styles'
									),
								],
							},
						},
					},
				],
			},
		],
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
		} ),
		mode === 'production' && new ReadableJsAssetsWebpackPlugin(),
		new DependencyExtractionWebpackPlugin( { injectPolyfill: false } ),
		new MiniCSSExtractPlugin( {
			filename: ( pathData ) => {
				if (
					GUTENBERG_PACKAGES.find(
						( packageName ) =>
							pathData.chunk.name === `${ packageName }/index`
					)
				) {
					return pathData.chunk.name.replace(
						'/index',
						'/style.css'
					);
				}
				return '[name].css';
			},
		} ),
		new RtlCssPlugin( {
			filename: ( pathData ) => {
				if (
					GUTENBERG_PACKAGES.find(
						( packageName ) =>
							pathData.chunk.name === `${ packageName }/index`
					)
				) {
					return pathData.chunk.name.replace(
						'/index',
						'/style-rtl.css'
					);
				}
				return '[name]-rtl.css';
			},
		} ),
		new CopyWebpackPlugin( {
			patterns: [].concat(
				Object.entries( {
					'./packages/block-library/src/': 'block-library/blocks/',
					'./packages/edit-widgets/src/blocks/':
						'edit-widgets/blocks/',
					'./packages/widgets/src/blocks/': 'widgets/blocks/',
				} ).flatMap( ( [ from, to ] ) => [
					{
						from: `${ from }/**/index.php`,
						to( { absoluteFilename } ) {
							const [ , dirname ] = absoluteFilename.match(
								new RegExp(
									`([\\w-]+)${ escapeRegExp(
										sep
									) }index\\.php$`
								)
							);

							return join( to, `${ dirname }.php` );
						},
						transform: ( content ) => {
							content = content.toString();

							// Within content, search for any function definitions. For
							// each, replace every other reference to it in the file.
							return (
								Array.from(
									content.matchAll(
										/^\s*function ([^\(]+)/gm
									)
								)
									.reduce( ( result, [ , functionName ] ) => {
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
						noErrorOnMissing: true,
					},
					{
						from: `${ from }/*/block.json`,
						to( { absoluteFilename } ) {
							const [ , dirname ] = absoluteFilename.match(
								new RegExp(
									`([\\w-]+)${ escapeRegExp(
										sep
									) }block\\.json$`
								)
							);

							return join( to, dirname, 'block.json' );
						},
					},
				] )
			),
		} ),
		new ForkTsCheckerWebpackPlugin( {
			typescript: {
				diagnosticOptions: {
					semantic: true,
					syntactic: true,
				},
				mode: 'write-references',
				build: true,
			},
		} ),
		new IgnoreEmitPlugin( /\.css-entry\.js$/ ),
	].filter( Boolean ),
	resolve: {
		extensions: [ '.ts', '.tsx', '...' ],
		mainFields: [
			'gutenberg:source',
			// "react-native" field usually has the source entry file.
			'react-native',
			'browser',
			'module',
			'main',
		],
	},
	stats:
		mode === 'production'
			? 'normal'
			: {
					preset: 'minimal',
					version: false,
					modules: false,
					assets: false,
			  },
};
