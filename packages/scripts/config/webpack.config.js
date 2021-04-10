/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );
const MiniCSSExtractPlugin = require( 'mini-css-extract-plugin' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const { CleanWebpackPlugin } = require( 'clean-webpack-plugin' );
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );
const postcssPlugins = require( '@wordpress/postcss-plugins-preset' );

/**
 * Internal dependencies
 */
const {
	getPackageProp,
	hasBabelConfig,
	hasPostCSSConfig,
} = require( '../utils' );
const FixStyleWebpackPlugin = require( './fix-style-webpack-plugin' );

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const cssLoaders = [
	{
		loader: MiniCSSExtractPlugin.loader,
	},
	{
		loader: require.resolve( 'css-loader' ),
		options: {
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
				ident: 'postcss',
				plugins: postcssPlugins,
			} ),
		},
	},
];

/**
 * Gets a unique identifier for the webpack build to avoid multiple webpack
 * runtimes to conflict when using globals.
 * This is polyfill and it is based on the default webpack 5 implementation.
 *
 * @see https://github.com/webpack/webpack/blob/bbb16e7af2eddba4cd77ca739904c2aa238a2b7b/lib/config/defaults.js#L374-L376
 *
 * @return {string} The generated identifier.
 */
const getJsonpFunctionIdentifier = () => {
	const jsonpFunction = 'webpackJsonp_';
	const packageName = getPackageProp( 'name' );
	if ( typeof packageName !== 'string' || ! packageName ) {
		return jsonpFunction;
	}
	const IDENTIFIER_NAME_REPLACE_REGEX = /^([^a-zA-Z$_])/;
	const IDENTIFIER_ALPHA_NUMERIC_NAME_REPLACE_REGEX = /[^a-zA-Z0-9$]+/g;

	return (
		jsonpFunction +
		packageName
			.replace( IDENTIFIER_NAME_REPLACE_REGEX, '_$1' )
			.replace( IDENTIFIER_ALPHA_NUMERIC_NAME_REPLACE_REGEX, '_' )
	);
};

const getLiveReloadPort = ( inputPort ) => {
	const parsedPort = parseInt( inputPort, 10 );

	return Number.isInteger( parsedPort ) ? parsedPort : 35729;
};

const config = {
	mode,
	entry: {
		index: path.resolve( process.cwd(), 'src', 'index.js' ),
	},
	output: {
		filename: '[name].js',
		path: path.resolve( process.cwd(), 'build' ),
		// Prevents conflicts when multiple webpack runtimes (from different apps)
		// are used on the same page.
		// @see https://github.com/WordPress/gutenberg/issues/23607
		jsonpFunction: getJsonpFunctionIdentifier(),
	},
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
	},
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		concatenateModules:
			mode === 'production' && ! process.env.WP_BUNDLE_ANALYZER,
		splitChunks: {
			cacheGroups: {
				style: {
					test: /[\\/]style(\.module)?\.(sc|sa|c)ss$/,
					chunks: 'all',
					enforce: true,
					automaticNameDelimiter: '-',
				},
				default: false,
			},
		},
		minimizer: [
			new TerserPlugin( {
				cache: true,
				parallel: true,
				sourceMap: ! isProduction,
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
				test: /\.jsx?$/,
				exclude: /node_modules/,
				use: [
					require.resolve( 'thread-loader' ),
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
				use: [ '@svgr/webpack', 'url-loader' ],
			},
			{
				test: /\.(bmp|png|jpe?g|gif)$/i,
				loader: require.resolve( 'file-loader' ),
				options: {
					name: 'images/[name].[hash:8].[ext]',
				},
			},
			{
				test: /\.(woff|woff2|eot|ttf|otf)$/,
				use: [
					{
						loader: 'file-loader',
						options: {
							name: 'fonts/[name].[hash:8].[ext]',
						},
					},
				],
			},
		],
	},
	plugins: [
		// During rebuilds, all webpack assets that are not used anymore will be
		// removed automatically. There is an exception added in watch mode for
		// fonts and images. It is a known limitations:
		// https://github.com/johnagan/clean-webpack-plugin/issues/159
		new CleanWebpackPlugin( {
			cleanAfterEveryBuildPatterns: [ '!fonts/**', '!images/**' ],
		} ),
		// The WP_BUNDLE_ANALYZER global variable enables a utility that represents
		// bundle content as a convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// MiniCSSExtractPlugin to extract the CSS thats gets imported into JavaScript.
		new MiniCSSExtractPlugin( { esModule: false, filename: '[name].css' } ),
		// MiniCSSExtractPlugin creates JavaScript assets for CSS that are
		// obsolete and should be removed. Related webpack issue:
		// https://github.com/webpack-contrib/mini-css-extract-plugin/issues/85
		new FixStyleWebpackPlugin(),
		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload
		// works when running watch mode.
		! isProduction &&
			new LiveReloadPlugin( {
				port: getLiveReloadPort( process.env.WP_LIVE_RELOAD_PORT ),
			} ),
		// WP_NO_EXTERNALS global variable controls whether scripts' assets get
		// generated, and the default externals set.
		! process.env.WP_NO_EXTERNALS &&
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
		exclude: [ /node_modules/ ],
		use: require.resolve( 'source-map-loader' ),
		enforce: 'pre',
	} );
}

module.exports = config;
