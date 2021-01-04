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
const { hasBabelConfig, hasPostCSSConfig } = require( '../utils' );
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

const config = {
	mode,
	target: 'browserslist',
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
	optimization: {
		// Only concatenate modules in production, when not analyzing bundles.
		concatenateModules:
			mode === 'production' && ! process.env.WP_BUNDLE_ANALYZER,
		splitChunks: {
			cacheGroups: {
				style: {
					test: /[\\/]style\.(sc|sa|c)ss$/,
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
				},
				extractComments: false,
			} ),
		],
	},
	module: {
		rules: [
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
				test: /\.svg$/,
				use: [ '@svgr/webpack', 'url-loader' ],
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
		],
	},
	plugins: [
		// During rebuilds, all webpack assets that are not used anymore
		// will be removed automatically.
		new CleanWebpackPlugin(),
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
				port: process.env.WP_LIVE_RELOAD_PORT || 35729,
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
