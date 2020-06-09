/**
 * External dependencies
 */
const path = require( 'path' );
const { DefinePlugin } = require( 'webpack' );
const ReactRefreshWebpackPlugin = require( '@pmmmwh/react-refresh-webpack-plugin' );

/**
 * WordPress dependencies
 */
const config = require( '@wordpress/scripts/config/webpack.config.js' );

const rules = config.module.rules;

// Add RFR Babel plugin.
const jsRule = rules[ 1 ];
const babelLoader = jsRule.use[ 1 ];
babelLoader.options.plugins = [ require.resolve( 'react-refresh/babel' ) ];

// Swap out CSS extract plugin for the style loader and include SASS base styles.
const sassRule = rules[ rules.length - 1 ];
sassRule.use[ 0 ] = 'style-loader';
const sassLoader = sassRule.use[ sassRule.use.length - 1 ];
sassLoader.options.sassOptions = {
	includePaths: [ path.resolve( __dirname, 'packages/base-styles' ) ],
};
sassLoader.options.prependData =
	[ 'colors', 'breakpoints', 'variables', 'mixins', 'animations', 'z-index' ]
		.map( ( imported ) => `@import "_${ imported }";` )
		.join( ' ' ) + '\n';

module.exports = {
	mode: 'development',
	devtool: 'inline-source-map',
	output: {
		// This is needed for the runtime to not mistakenly look
		// for updates in the WP port.
		publicPath: 'http://localhost:8081/',
	},
	devServer: {
		hot: true,
		headers: {
			// Requests come from the WP port.
			'Access-Control-Allow-Origin': '*',
		},
	},
	module: {
		rules,
	},
	plugins: [
		new DefinePlugin( {
			'process.env.GUTENBERG_PHASE': '2',
		} ),
		new ReactRefreshWebpackPlugin( {
			// This is needed for the overlay
			// to not use the WP port.
			overlay: { sockPort: 8081 },
		} ),
	],
	externals: {
		// `api-fetch` is rarely modified, so we
		// externalize it to take advantage of the
		// middleware bootstrapping Core does
		// for us.
		'@wordpress/api-fetch': 'wp.apiFetch',
	},
};
