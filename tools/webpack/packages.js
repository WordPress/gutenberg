/**
 * External dependencies
 */
const webpack = require( 'webpack' );
const CopyWebpackPlugin = require( 'copy-webpack-plugin' );
const MomentTimezoneDataPlugin = require( 'moment-timezone-data-webpack-plugin' );
const { join, resolve } = require( 'path' );
const glob = require( 'fast-glob' );

/**
 * WordPress dependencies
 */
const {
	camelCaseDash,
} = require( '@wordpress/dependency-extraction-webpack-plugin/lib/util' );
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { dependencies } = require( '../../package' );
const { baseConfig, plugins, stylesTransform } = require( './shared' );

const WEBPACK_DEV_SERVER_PORT = 8887;
const WORDPRESS_NAMESPACE = '@wordpress/';

// Experimental or other packages that should be private are bundled when used.
// That way, we can iterate on these package without making them part of the public API.
// See: https://github.com/WordPress/gutenberg/pull/19809
//
// !!
// This list must be kept in sync with the matching list in packages/dependency-extraction-webpack-plugin/lib/util.js
// !!
const BUNDLED_PACKAGES = [
	'@wordpress/dataviews',
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/sync',
	'@wordpress/undo-manager',
];

// PHP files in packages that have to be copied during build.
const bundledPackagesPhpConfig = [
	{
		from: './packages/style-engine',
		to: 'style-engine/',
		replaceClasses: [
			'WP_Style_Engine_CSS_Declarations',
			'WP_Style_Engine_CSS_Rules_Store',
			'WP_Style_Engine_CSS_Rule',
			'WP_Style_Engine_Processor',
			'WP_Style_Engine',
		],
	},
].map( ( { from, to, replaceClasses } ) => ( {
	from: `${ from }/*.php`,
	to( { absoluteFilename } ) {
		const [ , filename ] = absoluteFilename.match(
			/([\w-]+)(\.php){1,1}$/
		);
		return join( to, `${ filename }-gutenberg.php` );
	},
	transform: ( content ) => {
		const classSuffix = '_Gutenberg';
		const functionPrefix = 'gutenberg_';
		content = content.toString();
		// Replace class names.
		content = content.replace(
			new RegExp( replaceClasses.join( '|' ), 'g' ),
			( match ) => `${ match }${ classSuffix }`
		);
		// Replace function names.
		content = Array.from(
			content.matchAll( /^\s*function ([^\(]+)/gm )
		).reduce( ( result, [ , functionName ] ) => {
			// Prepend the Gutenberg prefix, substituting any
			// other core prefix (e.g. "wp_").
			return result.replace(
				new RegExp( functionName, 'g' ),
				( match ) => functionPrefix + match.replace( /^wp_/, '' )
			);
		}, content );
		return content;
	},
} ) );

const gutenbergPackages = Object.keys( dependencies )
	.filter(
		( packageName ) =>
			! BUNDLED_PACKAGES.includes( packageName ) &&
			packageName.startsWith( WORDPRESS_NAMESPACE ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' ) &&
			! packageName.startsWith( WORDPRESS_NAMESPACE + 'interactivity' )
	)
	.map( ( packageName ) => packageName.replace( WORDPRESS_NAMESPACE, '' ) );

const exportDefaultPackages = [
	'api-fetch',
	'deprecated',
	'dom-ready',
	'redux-routine',
	'token-list',
	'server-side-render',
	'shortcode',
	'warning',
];

const copiedVendors = {
	'react.js': 'react/umd/react.development.js',
	'react.min.js': 'react/umd/react.production.min.js',
	'react-dom.js': 'react-dom/umd/react-dom.development.js',
	'react-dom.min.js': 'react-dom/umd/react-dom.production.min.js',
};

const config = {
	...baseConfig,
	name: 'packages',
	entry: {
		...Object.fromEntries(
			gutenbergPackages.map( ( packageName ) => [
				packageName,
				{
					import: [ `./packages/${ packageName }` ],
					library: {
						name: [ 'wp', camelCaseDash( packageName ) ],
						type: 'window',
						export: exportDefaultPackages.includes( packageName )
							? 'default'
							: undefined,
					},
				},
			] )
		),
	},
	output: {
		devtoolNamespace: 'wp',
		filename( { chunk } ) {
			return chunk.name === 'runtime'
				? 'runtime.min.js'
				: './[name]/index.min.js';
		},
		path: join( __dirname, '..', '..', 'build' ),
		devtoolModuleFilenameTemplate: ( info ) => {
			if ( info.resourcePath.includes( '/@wordpress/' ) ) {
				const resourcePath =
					info.resourcePath.split( '/@wordpress/' )[ 1 ];
				return `../../packages/${ resourcePath }`;
			}
			return `webpack://${ info.namespace }/${ info.resourcePath }`;
		},
	},
	performance: {
		hints: false, // disable warnings about package sizes
	},
	optimization: {
		...baseConfig.optimization,
		runtimeChunk: {
			name: 'runtime',
		},
	},
	plugins: [
		...plugins,
		new DependencyExtractionWebpackPlugin( { injectPolyfill: true } ),
		new CopyWebpackPlugin( {
			patterns: bundledPackagesPhpConfig.concat(
				Object.entries( copiedVendors ).map( ( [ to, from ] ) => ( {
					from: `node_modules/${ from }`,
					to: `vendors/${ to }`,
				} ) )
			),
		} ),
		new MomentTimezoneDataPlugin( {
			startYear: 2000,
			endYear: 2040,
		} ),
	].filter( Boolean ),
};

if ( baseConfig.mode === 'development' ) {
	Object.keys( config.entry ).forEach( ( packageName ) => {
		config.entry[ packageName ].import.unshift(
			...glob.sync( `./packages/${ packageName }/build-style/*.css` )
		);
	} );
	config.entry[ '🔥hot' ] = {
		import: [
			// Runtime code for hot module replacement.
			'webpack/hot/only-dev-server.js',
			// Set the log level for HMR to "error".
			'./tools/webpack/set-hot-log-level.js',
			// Dev server client for web socket transport, hot and live reload logic.
			`webpack-dev-server/client/index.js?hot=true&live-reload=false&port=${ WEBPACK_DEV_SERVER_PORT }`,
		],
		filename: '🔥hot.js',
	};

	config.devServer = {
		static: {
			directory: resolve( __dirname, '../../build' ),
			publicPath: '/build/',
		},
		liveReload: false,
		devMiddleware: {
			writeToDisk( filePath ) {
				return ! /\.hot-update\.js(on)?(\.map)?$/.test( filePath );
			},
		},
		headers: {
			'Access-Control-Allow-Origin': '*',
		},
		allowedHosts: 'auto',
		host: 'localhost',
		port: WEBPACK_DEV_SERVER_PORT,
		client: false,
		hot: false,
	};

	config.module ||= { rules: [] };
	config.module.rules ||= [];
	config.module.rules.push( {
		test: /\.css$/,
		use: [
			resolve( __dirname, '../../packages/css-hmr-loader' ),
			{
				loader: 'file-loader',
				options: {
					name( resourcePath ) {
						const [ , packageName, fileName ] = resourcePath.match(
							/\/([^/]+)\/build-style\/(.+\.css)/
						);
						return `${ packageName }/${ fileName }?[contenthash]`;
					},
					publicPath: `/build/`,
				},
			},
		],
	} );

	config.plugins.push( new webpack.HotModuleReplacementPlugin() );
} else {
	config.plugins.push(
		new CopyWebpackPlugin( {
			patterns: gutenbergPackages.map( ( packageName ) => ( {
				from: '*.css',
				context: `./packages/${ packageName }/build-style`,
				to: `./${ packageName }`,
				transform: stylesTransform,
				noErrorOnMissing: true,
			} ) ),
		} )
	);
}

module.exports = config;
