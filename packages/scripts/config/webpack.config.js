/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );
const path = require( 'path' );

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

const babelLoader = hasBabelConfig() ? {
	test: /\.js$/,
	exclude: /node_modules/,
	use: require.resolve( 'babel-loader' ),
} : {
	test: /\.js$/,
	exclude: /node_modules/,
	use: {
		loader: require.resolve( 'babel-loader' ),
		options: {
			presets: [ require.resolve( '@wordpress/babel-preset-default' ) ],
		},
	},
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
	module: {
		rules: [
			{
				test: /\.js$/,
				use: require.resolve( 'source-map-loader' ),
				enforce: 'pre',
			},
			babelLoader,
		],
	},
	plugins: [
		// WP_BUNDLE_ANALYZER global variable enables utility that represents bundle content
		// as convenient interactive zoomable treemap.
		process.env.WP_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// WP_LIVE_RELOAD_PORT global variable changes port on which live reload works
		// when running watch mode.
		! isProduction && new LiveReloadPlugin( { port: process.env.WP_LIVE_RELOAD_PORT || 35729 } ),
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
