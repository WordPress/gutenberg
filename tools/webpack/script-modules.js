/**
 * External dependencies
 */
const { join } = require( 'path' );
const { readdirSync } = require( 'node:fs' );

/**
 * WordPress dependencies
 */
const DependencyExtractionWebpackPlugin = require( '@wordpress/dependency-extraction-webpack-plugin' );

/**
 * Internal dependencies
 */
const { baseConfig, plugins } = require( './shared' );

const WORDPRESS_NAMESPACE = '@wordpress/';

const packageDirs = readdirSync(
	new URL( '../packages', `file://${ __dirname }` ),
	{
		withFileTypes: true,
	}
).flatMap( ( dirent ) => ( dirent.isDirectory() ? [ dirent.name ] : [] ) );

/** @type {Map<string, string>} */
const gutenbergScriptModules = new Map();
for ( const packageDir of packageDirs ) {
	const packageJson = require( `@wordpress/${ packageDir }/package.json` );

	if ( ! Object.hasOwn( packageJson, 'wpScriptModuleExports' ) ) {
		continue;
	}

	const moduleName = packageJson.name.substring( WORDPRESS_NAMESPACE.length );
	let { wpScriptModuleExports } = packageJson;

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
			require.resolve( `@wordpress/${ packageDir }/${ exportPath }` )
		);
	}
}
module.exports = function () {
	const suffix = baseConfig.mode === 'production' ? '.min' : '';

	const config = {
		...baseConfig,
		name: 'script-modules',
		entry: Object.fromEntries( gutenbergScriptModules.entries() ),
		experiments: {
			outputModule: true,
		},
		output: {
			devtoolNamespace: 'wp',
			filename: `[name]${ suffix }.js`,
			library: {
				type: 'module',
			},
			path: join( __dirname, '..', '..', 'build-module' ),
			environment: { module: true },
			module: true,
			chunkFormat: 'module',
			asyncChunks: false,
		},
		resolve: {
			extensions: [ '.js', '.ts', '.tsx' ],
		},
		plugins: [
			...plugins,
			new DependencyExtractionWebpackPlugin( {
				combineAssets: true,
				combinedOutputFile: `./assets${ suffix }.php`,
			} ),
		],
		watchOptions: {
			ignored: [ '**/node_modules' ],
			aggregateTimeout: 500,
		},
	};
	return config;
};
