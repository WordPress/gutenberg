/**
 * External dependencies
 */
const { join } = require( 'path' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

const WORDPRESS_NAMESPACE = '@wordpress/';
const { createRequire } = require( 'node:module' );

const rootPath = `${ __dirname }/../../`;
const fromRootRequire = createRequire( rootPath );

/** @type {Iterable<[string, string]>} */
const iterableDeps = Object.entries(
	fromRootRequire( './package.json' ).dependencies
);

/** @type {Map<string, string>} */
const gutenbergScriptModules = new Map();
for ( const [ packageName, versionSpecifier ] of iterableDeps ) {
	if (
		! packageName.startsWith( WORDPRESS_NAMESPACE ) ||
		! versionSpecifier.startsWith( 'file:' ) ||
		packageName.startsWith( WORDPRESS_NAMESPACE + 'react-native' )
	) {
		continue;
	}
	const packageRequire = createRequire(
		`${ rootPath }/${ versionSpecifier.substring( 5 ) }/`
	);
	const depPackageJson = packageRequire( './package.json' );
	if ( ! Object.hasOwn( depPackageJson, 'wpScriptModuleExports' ) ) {
		continue;
	}

	const moduleName = packageName.substring( WORDPRESS_NAMESPACE.length );
	let { wpScriptModuleExports } = depPackageJson;

	// Special handling for { "wpScriptModuleExports": "./build-module/index.js" }.
	if ( typeof wpScriptModuleExports === 'string' ) {
		wpScriptModuleExports = { '.': wpScriptModuleExports };
	}

	if ( Object.getPrototypeOf( wpScriptModuleExports ) !== Object.prototype ) {
		throw new Error( 'wpScriptModuleExports must be an object' );
	}

	for ( const [ exportName, exportPath ] of Object.entries(
		wpScriptModuleExports
	) ) {
		if ( typeof exportPath !== 'string' ) {
			throw new Error( 'wpScriptModuleExports paths must be strings' );
		}

		if ( ! exportPath.startsWith( './' ) ) {
			throw new Error(
				'wpScriptModuleExports paths must start with "./"'
			);
		}

		const name =
			exportName === '.' ? 'index' : exportName.replace( /^\.\/?/, '' );

		gutenbergScriptModules.set(
			`${ moduleName }/${ name }`,
			packageRequire.resolve( exportPath )
		);
	}
}

module.exports = {
	...baseConfig,
	name: 'script-modules',
	entry: gutenbergScriptModules,
	experiments: {
		outputModule: true,
	},
	output: {
		devtoolNamespace: 'wp',
		filename: './build-module/[name].min.js',
		library: {
			type: 'module',
		},
		path: join( __dirname, '..', '..' ),
		environment: { module: true },
		module: true,
		chunkFormat: 'module',
		asyncChunks: false,
	},
	resolve: {
		extensions: [ '.js', '.ts', '.tsx' ],
	},
	module: {
		rules: [
			{
				test: /\.(j|t)sx?$/,
				exclude: /node_modules/,
				use: [
					{
						loader: require.resolve( 'babel-loader' ),
						options: {
							cacheDirectory:
								process.env.BABEL_CACHE_DIRECTORY || true,
							babelrc: false,
							configFile: false,
							presets: [
								'@babel/preset-typescript',
								'@babel/preset-react',
							],
						},
					},
				],
			},
		],
	},
	plugins: [ ...plugins, new DependencyExtractionWebpackPlugin() ],
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
