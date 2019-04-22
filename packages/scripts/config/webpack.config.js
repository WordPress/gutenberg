/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );
const path = require( 'path' );
const postcssPresetEnv = require( 'postcss-preset-env' );
const MiniCssExtractPlugin = require( 'mini-css-extract-plugin' );

/**
 * Internal dependencies
 */
const { camelCaseDash, hasBabelConfig } = require( '../utils' );

/**
 * Converts @wordpress/* string request into request object.
 *
 * Note this isn't the same as camel case because of the
 * way that numbers don't trigger the capitalized next letter.
 *
 * @example
 * formatRequest( '@wordpress/api-fetch' );
 * // { this: [ 'wp', 'apiFetch' ] }
 * formatRequest( '@wordpress/i18n' );
 * // { this: [ 'wp', 'i18n' ] }
 *
 * @param {string} request Request name from import statement.
 * @return {Object} Request object formatted for further processing.
 */
const formatRequest = ( request ) => {
	// '@wordpress/api-fetch' -> [ '@wordpress', 'api-fetch' ]
	const [ , name ] = request.split( '/' );

	// { this: [ 'wp', 'apiFetch' ] }
	return {
		this: [ 'wp', camelCaseDash( name ) ],
	};
};

const wordpressExternals = ( context, request, callback ) => {
	if ( /^@wordpress\//.test( request ) ) {
		callback( null, formatRequest( request ), 'this' );
	} else {
		callback();
	}
};

const externals = [
	{
		react: 'React',
		'react-dom': 'ReactDOM',
		moment: 'moment',
		jquery: 'jQuery',
		lodash: 'lodash',
		'lodash-es': 'lodash',

		// Distributed NPM packages may depend on Babel's runtime regenerator.
		// In a WordPress context, the regenerator is assigned to the global
		// scope via the `wp-polyfill` script. It is reassigned here as an
		// externals to reduce the size of generated bundles.
		//
		// See: https://github.com/WordPress/gutenberg/issues/13890
		'@babel/runtime/regenerator': 'regeneratorRuntime',
	},
	wordpressExternals,
];

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const getBabelLoaderOptions = () =>
	hasBabelConfig() ?
		{} :
		{
			babelrc: false,
			configFile: false,
			presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		};

const config = {
	mode,
	entry: {
		index: path.resolve( process.cwd(), 'src', 'index.js' ),
	},
	output: {
		filename: '[name].js',
		path: path.resolve( process.cwd(), 'build' ),
	},
	externals,
	resolve: {
		alias: {
			'lodash-es': 'lodash',
		},
	},
	optimization: {
		splitChunks: {
			chunks: 'all',
			cacheGroups: {
				editor: {
					name: 'editor',
					test: /editor\.(sc|sa|c)ss$/,
					enforce: true,
				},
				style: {
					name: 'styles',
					test: /style\.(sc|sa|c)ss$/,
					enforce: true,
				},
				theme: {
					name: 'theme',
					test: /theme\.(sc|sa|c)ss$/,
					enforce: true,
				},
				default: false,
			},
		},
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: require.resolve( 'source-map-loader' ),
				enforce: 'pre',
			},
			{
				test: /\.js$/,
				exclude: /node_modules/,
				use: {
					loader: require.resolve( 'babel-loader' ),
					options: getBabelLoaderOptions(),
				},
			},
			{
				test: /\.(sc|sa|c)ss$/,
				use: [
					{
						loader: MiniCssExtractPlugin.loader,
					},
					{
						loader: require.resolve( 'css-loader' ),
					},
					{
						loader: require.resolve( 'sass-loader' ),
					},
					{
						loader: require.resolve( 'postcss-loader' ),
						options: {
							ident: 'postcss',
							plugins: () => [
								postcssPresetEnv( {
									// Start with a stage.
									stage: 3,
									// Override specific features you do (or don't) want.
									features: {
										// And, optionally, configure rules/features as needed.
										'custom-media-queries': {
											preserve: false,
										},
										'custom-properties': {
											preserve: true,
										},
										'nesting-rules': true,
									},
								} ),
							],
						},
					},
				],
			},
		],
	},
	plugins: [
		// WP_BUNDLE_ANALYZER global variable enables utility that represents bundle content
		// as convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// MiniCssExtractPlugin to extract the css thats gets imported into javascript
		new MiniCssExtractPlugin(),
		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload works
		// when running watch mode.
		! isProduction &&
			new LiveReloadPlugin( { port: process.env.WP_LIVE_RELOAD_PORT || 35729 } ),
	].filter( Boolean ),
	stats: {
		children: false,
	},
};

if ( ! isProduction ) {
	// WP_DEVTOOL global variable controls how source maps are generated.
	// See: https://webpack.js.org/configuration/devtool/#devtool.
	config.devtool = process.env.WP_DEVTOOL || 'source-map';
}

module.exports = config;
