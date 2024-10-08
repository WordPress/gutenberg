/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const { DefinePlugin } = require( 'webpack' );
const TerserPlugin = require( 'terser-webpack-plugin' );
const postcss = require( 'postcss' );

/**
 * WordPress dependencies
 */
const ReadableJsAssetsWebpackPlugin = require( '@wordpress/readable-js-assets-webpack-plugin' );

const { NODE_ENV: mode = 'development', WP_DEVTOOL: devtool = 'source-map' } =
	process.env;

const baseConfig = {
	target: 'browserslist',
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
	mode,
	module: {
		rules: [
			{
				test: /\.js$/,
				use: require.resolve( 'source-map-loader' ),
				enforce: 'pre',
			},
		],
	},
	watchOptions: {
		ignored: [
			'**/node_modules',
			'**/packages/*/src/**/*.{js,ts,tsx,scss}',
		],
		aggregateTimeout: 500,
	},
	devtool,
};

const plugins = [
	// The WP_BUNDLE_ANALYZER global variable enables a utility that represents bundle
	// content as a convenient interactive zoomable treemap.
	process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
	new DefinePlugin( {
		// Inject the `IS_GUTENBERG_PLUGIN` global, used for feature flagging.
		'globalThis.IS_GUTENBERG_PLUGIN': JSON.stringify(
			Boolean( process.env.npm_package_config_IS_GUTENBERG_PLUGIN )
		),
		// Inject the `IS_WORDPRESS_CORE` global, used for feature flagging.
		'globalThis.IS_WORDPRESS_CORE': JSON.stringify(
			Boolean( process.env.npm_package_config_IS_WORDPRESS_CORE )
		),
		// Inject the `SCRIPT_DEBUG` global, used for dev versions of JavaScript.
		'globalThis.SCRIPT_DEBUG': JSON.stringify( mode === 'development' ),
	} ),
	mode === 'production' && new ReadableJsAssetsWebpackPlugin(),
];

const stylesTransform = ( content ) => {
	return postcss( [
		require( 'cssnano' )( {
			preset: [
				'default',
				{
					discardComments: {
						removeAll: true,
					},
					normalizeWhitespace: mode === 'production',
				},
			],
		} ),
	] )
		.process( content, {
			from: 'src/app.css',
			to: 'dest/app.css',
		} )
		.then( ( result ) => result.css );
};

module.exports = {
	baseConfig,
	plugins,
	stylesTransform,
};
