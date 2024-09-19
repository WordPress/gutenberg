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

const rootURL = new URL( '..', `file://${ __dirname }` );
const fromRootRequire = createRequire( rootURL );

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
		// Remove the leading "file:" specifier to build a package URL.
		new URL( `${ versionSpecifier.substring( 5 ) }/`, rootURL )
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
	entry: Object.fromEntries( gutenbergScriptModules.entries() ),
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
	plugins: [ ...plugins, new DependencyExtractionWebpackPlugin() ],
	watchOptions: {
		ignored: [ '**/node_modules' ],
		aggregateTimeout: 500,
	},
};
