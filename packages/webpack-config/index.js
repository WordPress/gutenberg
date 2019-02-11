/**
 * External dependencies
 */
const { BundleAnalyzerPlugin } = require( 'webpack-bundle-analyzer' );
const LiveReloadPlugin = require( 'webpack-livereload-plugin' );

/**
 * Converts @wordpress require into window reference
 *
 * Note this isn't the same as camel case because of the
 * way that numbers don't trigger the capitalized next letter
 *
 * @example
 * wordpressRequire( '@wordpress/api-fetch' ) = 'wp.apiFetch'
 * wordpressRequire( '@wordpress/i18n' ) = 'wp.i18n'
 *
 * @param {string} request import name
 * @return {string} global variable reference for import
 */
const wordpressRequire = ( request ) => {
	// @wordpress/components -> [ @wordpress, components ]
	const [ , name ] = request.split( '/' );

	// components -> wp.components
	return `wp.${ name.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() ) }`;
};

const wordpressExternals = ( context, request, callback ) =>
	/^@wordpress\//.test( request ) ?
		callback( null, `root ${ wordpressRequire( request ) }` ) :
		callback();

const externals = [
	{
		react: 'React',
		'react-dom': 'ReactDOM',
		moment: 'moment',
		jquery: 'jQuery',
		lodash: 'lodash',
		'lodash-es': 'lodash',
	},
	wordpressExternals,
];

const isProduction = process.env.NODE_ENV === 'production';
const mode = isProduction ? 'production' : 'development';

const config = {
	mode,
	output: {
		filename: './build/[basename]/index.js',
		path: process.cwd(),
		library: [ 'wp', '[name]' ],
		libraryTarget: 'this',
	},
	externals,
	resolve: {
		modules: [
			process.cwd(),
			'node_modules',
		],
		alias: {
			'lodash-es': 'lodash',
		},
	},
	module: {
		rules: [
			{
				test: /\.js$/,
				use: [ 'source-map-loader' ],
				enforce: 'pre',
			},
			{
				test: /\.js$/,
				exclude: [
					/block-serialization-spec-parser/,
					/is-shallow-equal/,
					/node_modules/,
				],
				use: 'babel-loader',
			},
		],
	},
	plugins: [
		// GUTENBERG_BUNDLE_ANALYZER global variable enables utility that represents bundle content
		// as convenient interactive zoomable treemap.
		process.env.GUTENBERG_BUNDLE_ANALYZER && new BundleAnalyzerPlugin(),
		// GUTENBERG_LIVE_RELOAD_PORT global variable changes port on which live reload works
		// when running watch mode.
		! isProduction && new LiveReloadPlugin( { port: process.env.GUTENBERG_LIVE_RELOAD_PORT || 35729 } ),
	].filter( Boolean ),
	stats: {
		children: false,
	},
};

if ( ! isProduction ) {
	// GUTENBERG_DEVTOOL global variable controls how source maps are generated.
	// See: https://webpack.js.org/configuration/devtool/#devtool.
	config.devtool = process.env.GUTENBERG_DEVTOOL || 'source-map';
}

module.exports = config;
