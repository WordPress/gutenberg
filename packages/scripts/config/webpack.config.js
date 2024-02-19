/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const webpack = require( 'webpack' );
const browserslist = require( 'browserslist' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const { basename, dirname, resolve } = require( 'path' );
const ReactRefreshWebpackPlugin = require( '@pmmmwh/react-refresh-webpack-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const { realpathSync } = require( 'fs' );
const { sync: glob } = require( 'fast-glob' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );

/**
 * Internal dependencies
 */
const {
	fromConfigRoot,
	hasBabelConfig,
	hasArgInCLI,
	hasCssnanoConfig,
	hasPostCSSConfig,
	getWordPressSrcDirectory,
	getWebpackEntryPoints,
	getRenderPropPaths,
	getAsBooleanFromENV,
	getBlockJsonModuleFields,
	getBlockJsonScriptFields,
	fromProjectRoot,
} = require( '../utils' );

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';
let target = 'browserslist';
if ( ! browserslist.findConfig( '.' ) ) {
	target += ':' + fromConfigRoot( '.browserslistrc' );
}
const hasReactFastRefresh = hasArgInCLI( '--hot' ) && ! isProduction;
const hasExperimentalModulesFlag = getAsBooleanFromENV(
	'WP_EXPERIMENTAL_MODULES'
);

/**
 * The plugin recomputes the render paths once on each compilation. It is necessary to avoid repeating processing
 * when filtering every discovered PHP file in the source folder. This is the most performant way to ensure that
 * changes in `block.json` files are picked up in watch mode.
 */
class RenderPathsPlugin {
	/**
	 * Paths with the `render` props included in `block.json` files.
	 *
	 * @type {string[]}
	 */
	static renderPaths;

	apply( compiler ) {
		const pluginName = this.constructor.name;

		compiler.hooks.thisCompilation.tap( pluginName, () => {
			this.constructor.renderPaths = getRenderPropPaths();
		} );
	}
}

const cssLoaders = [
	{
		loader: MiniCSSExtractPlugin.loader,
	},
	{
		loader: require.resolve( 'css-loader' ),
		options: {
			importLoaders: 1,
			sourceMap: ! isProduction,
			modules: {
				auto: true,
			},
		},
	},
	{
		loader: require.resolve( 'postcss-loader' ),
		options: {
			// Provide a fallback configuration if there's not
			// one explicitly available in the project.
			...( ! hasPostCSSConfig() && {
				postcssOptions: {
					ident: 'postcss',
					sourceMap: ! isProduction,
					plugins: isProduction
						? [
								...postcssPlugins,
								require( 'cssnano' )( {
									// Provide a fallback configuration if there's not
									// one explicitly available in the project.
									...( ! hasCssnanoConfig() && {
										preset: [
											'default',
											{
												discardComments: {
													removeAll: true,
												},
											},
										],
									} ),
								} ),
						  ]
						: postcssPlugins,
				},
			} ),
		},
	},
];

/** @type {webpack.Configuration} */
const baseConfig = {
	mode,
	target,
	output: {
		filename: '[name].js',
		path: resolve( process.cwd(), 'build' ),
	},
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
		extensions: [ '.jsx', '.ts', '.tsx', '...' ],
	},
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		concatenateModules: isProduction && ! process.env.WP_BUNDLE_ANALYZER,
		splitChunks: {
			cacheGroups: {
				style: {
					type: 'css/mini-extract',
					test: /[\\/]style(\.module)?\.(pc|sc|sa|c)ss$/,
					chunks: 'all',
					enforce: true,
					name( _, chunks, cacheGroupKey ) {
						const chunkName = chunks[ 0 ].name;
						return `${ dirname(
							chunkName
						) }/${ cacheGroupKey }-${ basename( chunkName ) }`;
					},
				},
				default: false,
			},
		},
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
				test: /\.m?(j|t)sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							// Babel uses a directory within local node_modules
							// by default. Use the environment variable option
							// to enable more persistent caching.
							cacheDirectory:
								process.env.BABEL_CACHE_DIRECTORY || true,

							// Provide a fallback configuration if there's not
							// one explicitly available in the project.
							...( ! hasBabelConfig() && {
								babelrc: false,
								configFile: false,
								presets: [
									require.resolve(
										'@wordpress/babel-preset-default'
									),
								],
								plugins: [
									hasReactFastRefresh &&
										require.resolve(
											'react-refresh/babel'
										),
								].filter( Boolean ),
							} ),
						},
					},
				],
			},
			{
				test: /\.css$/,
				use: cssLoaders,
			},
			{
				test: /\.pcss$/,
				use: cssLoaders,
			},
			{
				test: /\.(sc|sa)ss$/,
				use: [
					...cssLoaders,
					{
						loader: require.resolve( 'sass-loader' ),
						options: {
							sourceMap: ! isProduction,
						},
					},
				],
			},
			{
				test: /\.svg$/,
				issuer: /\.(j|t)sx?$/,
				use: [ '@svgr/webpack', 'url-loader' ],
				type: 'javascript/auto',
			},
			{
				test: /\.svg$/,
				issuer: /\.(pc|sc|sa|c)ss$/,
				type: 'asset/inline',
			},
			{
				test: /\.(bmp|png|jpe?g|gif|webp)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'images/[name].[hash:8][ext]',
				},
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/i,
				type: 'asset/resource',
				generator: {
					filename: 'fonts/[name].[hash:8][ext]',
				},
			},
		],
	},
	stats: {
		children: false,
	},
};

// WP_DEVTOOL global variable controls how source maps are generated.
// See: https://webpack.js.org/configuration/devtool/#devtool.
if ( process.env.WP_DEVTOOL ) {
	baseConfig.devtool = process.env.WP_DEVTOOL;
}

if ( ! isProduction ) {
	// Set default sourcemap mode if it wasn't set by WP_DEVTOOL.
	baseConfig.devtool = baseConfig.devtool || 'source-map';
}

// Add source-map-loader if devtool is set, whether in dev mode or not.
if ( baseConfig.devtool ) {
	baseConfig.module.rules.unshift( {
		test: /\.(j|t)sx?$/,
		exclude: [ /node_modules/ ],
		use: require.resolve( 'source-map-loader' ),
		enforce: 'pre',
	} );
}

/** @type {webpack.Configuration} */
const scriptConfig = {
	...baseConfig,

	entry: getWebpackEntryPoints( 'script' ),

	devServer: isProduction
		? undefined
		: {
				devMiddleware: {
					writeToDisk: true,
				},
				allowedHosts: 'auto',
				host: 'localhost',
				port: 8887,
				proxy: {
					'/build': {
						pathRewrite: {
							'^/build': '',
						},
					},
				},
		  },

	plugins: [
		new webpack.DefinePlugin( {
			// Inject the `SCRIPT_DEBUG` global, used for development features flagging.
			SCRIPT_DEBUG: ! isProduction,
		} ),

		// If we run a modules build, the 2 compilations can "clean" each other's output
		// Prevent the cleaning from happening
		! hasExperimentalModulesFlag &&
			new CleanWebpackPlugin( {
				cleanAfterEveryBuildPatterns: [ '!fonts/**', '!images/**' ],
				// Prevent it from deleting webpack assets during builds that have
				// multiple configurations returned in the webpack config.
				cleanStaleWebpackAssets: false,
			} ),

		new RenderPathsPlugin(),
		new CopyWebpackPlugin( {
			patterns: [
				{
					from: '**/block.json',
					context: getWordPressSrcDirectory(),
					noErrorOnMissing: true,
					transform( content, absoluteFrom ) {
						const convertExtension = ( path ) => {
							return path.replace( /\.m?(j|t)sx?$/, '.js' );
						};

						if ( basename( absoluteFrom ) === 'block.json' ) {
							const blockJson = JSON.parse( content.toString() );

							[
								getBlockJsonScriptFields( blockJson ),
								getBlockJsonModuleFields( blockJson ),
							].forEach( ( fields ) => {
								if ( fields ) {
									for ( const [
										key,
										value,
									] of Object.entries( fields ) ) {
										if ( Array.isArray( value ) ) {
											blockJson[ key ] =
												value.map( convertExtension );
										} else if (
											typeof value === 'string'
										) {
											blockJson[ key ] =
												convertExtension( value );
										}
									}
								}
							} );

							return JSON.stringify( blockJson, null, 2 );
						}

						return content;
					},
				},
				{
					from: '**/*.php',
					context: getWordPressSrcDirectory(),
					noErrorOnMissing: true,
					filter: ( filepath ) => {
						return (
							process.env.WP_COPY_PHP_FILES_TO_DIST ||
							RenderPathsPlugin.renderPaths.includes(
								realpathSync( filepath ).replace( /\\/g, '/' )
							)
						);
					},
				},
			],
		} ),
		// The WP_BUNDLE_ANALYZER global variable enables a utility that represents
		// bundle content as a convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin( { filename: '[name].css' } ),
		// React Fast Refresh.
		hasReactFastRefresh && new ReactRefreshWebpackPlugin(),
		// WP_NO_EXTERNALS global variable controls whether scripts' assets get
		// generated, and the default externals set.
		! process.env.WP_NO_EXTERNALS &&
			new DependencyExtractionWebpackPlugin(),
	].filter( Boolean ),
};

if ( hasExperimentalModulesFlag ) {
	/**
	 * Add block.json files to compilation to ensure changes trigger rebuilds when watching
	 */
	class BlockJsonDependenciesPlugin {
		constructor() {
			/** @type {ReadonlyArray<string>} */
			this.blockJsonFiles = glob( '**/block.json', {
				absolute: true,
				cwd: fromProjectRoot( getWordPressSrcDirectory() ),
			} );
		}

		/**
		 * Apply the plugin
		 * @param {webpack.Compiler} compiler the compiler instance
		 * @return {void}
		 */
		apply( compiler ) {
			if ( this.blockJsonFiles.length ) {
				compiler.hooks.compilation.tap(
					'BlockJsonDependenciesPlugin',
					( compilation ) => {
						compilation.fileDependencies.addAll(
							this.blockJsonFiles
						);
					}
				);
			}
		}
	}

	/** @type {webpack.Configuration} */
	const moduleConfig = {
		...baseConfig,

		entry: getWebpackEntryPoints( 'module' ),

		experiments: {
			...baseConfig.experiments,
			outputModule: true,
		},

		output: {
			...baseConfig.output,
			module: true,
			chunkFormat: 'module',
			environment: {
				...baseConfig.output.environment,
				module: true,
			},
			library: {
				...baseConfig.output.library,
				type: 'module',
			},
		},

		plugins: [
			new webpack.DefinePlugin( {
				// Inject the `SCRIPT_DEBUG` global, used for development features flagging.
				SCRIPT_DEBUG: ! isProduction,
			} ),
			// The WP_BUNDLE_ANALYZER global variable enables a utility that represents
			// bundle content as a convenient interactive zoomable treemap.
			process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
			// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
			new MiniCSSExtractPlugin( { filename: '[name].css' } ),
			// WP_NO_EXTERNALS global variable controls whether scripts' assets get
			// generated, and the default externals set.
			! process.env.WP_NO_EXTERNALS &&
				new DependencyExtractionWebpackPlugin(),
			new BlockJsonDependenciesPlugin(),
		].filter( Boolean ),
	};

	module.exports = [ scriptConfig, moduleConfig ];
} else {
	module.exports = scriptConfig;
}
