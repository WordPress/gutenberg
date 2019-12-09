/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { hasBabelConfig } = require( '../utils' );

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

/** @return {Object} */
function getPackageOptions() {
	try {
		const manifest = require( path.join( process.cwd(), 'package.json' ) );
		if ( ! manifest[ 'wp-scripts' ] ) {
			return {};
		}
		return manifest[ 'wp-scripts' ];
	} catch ( error ) {
		return {};
	}
}

/** @return {string[] | undefined} */
function getTranspileDependenciesOption() {
	const options = getPackageOptions();
	if ( ! options.build || ! options.build[ 'transpile-dependencies' ] || ! Array.isArray( options.build[ 'transpile-dependencies' ] ) ) {
		return undefined;
	}
	return options.build[ 'transpile-dependencies' ];
}

/** @returns {RegExp | RegExp[]} */
function getTranspileDependenciesInclude() {
	const dependencies = getTranspileDependenciesOption();
	if ( ! dependencies ) {
		return /node_modules/;
	}
	return dependencies.map( ( dependency ) => new RegExp( `node_modules\/${ dependency }\/`, 'g' ) );
}

const config = {
	mode,
	entry: {
		index: path.resolve( process.cwd(), 'src', 'index.js' ),
	},
	output: {
		filename: '[name].js',
		path: path.resolve( process.cwd(), 'build' ),
	},
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
	},
	module: {
		rules: [
			{
				oneOf: [
					// transpile application code
					{
						test: /\.js$/,
						exclude: /node_modules/,
						use: [
							require.resolve( 'thread-loader' ),
							{
								loader: require.resolve( 'babel-loader' ),
								options: {
									// Babel uses a directory within local node_modules
									// by default. Use the environment variable option
									// to enable more persistent caching.
									cacheDirectory: process.env.BABEL_CACHE_DIRECTORY || true,

									// Provide a fallback configuration if there's not
									// one explicitly available in the project.
									...( ! hasBabelConfig() && {
										babelrc: false,
										configFile: false,
										presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
									} ),
								},
							},
						],
					},
					// transpile third-party code which might be being distributed according to the current JS standard
					{
						test: /\.js$/,
						include: getTranspileDependenciesInclude(),
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
				],
			},
		],
	},
	plugins: [
		// WP_BUNDLE_ANALYZER global variable enables utility that represents bundle content
		// as convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload works
		// when running watch mode.
		! isProduction && new LiveReloadPlugin( { port: process.env.WP_LIVE_RELOAD_PORT || 35729 } ),
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
	].filter( Boolean ),
	stats: {
		children: false,
	},
};

if ( ! isProduction ) {
	// WP_DEVTOOL global variable controls how source maps are generated.
	// See: https://webpack.js.org/configuration/devtool/#devtool.
	config.devtool = process.env.WP_DEVTOOL || 'source-map';
	config.module.rules.unshift( {
		test: /\.js$/,
		use: require.resolve( 'source-map-loader' ),
		enforce: 'pre',
	} );
}

module.exports = config;
