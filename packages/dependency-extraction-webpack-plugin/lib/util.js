const WORDPRESS_NAMESPACE = '@wordpress/';
const { readFileSync, existsSync } = require( 'fs' );
const path = require( 'path' );
const { createRequire } = require( 'module' );

const packageJsonCache = new Map();
const packagePathCache = new Map();

/**
 * Find the nearest package root directory by walking up from the given directory.
 * Looks for a directory containing package.json.
 *
 * @param {string} startDir The directory to start searching from.
 * @return {string} The package root directory, or the start directory if no package.json found.
 */
function findPackageRoot( startDir ) {
	let current = startDir;
	const root = path.parse( current ).root;

	while ( current !== root ) {
		const packageJsonPath = path.join( current, 'package.json' );
		if ( existsSync( packageJsonPath ) ) {
			return current;
		}
		current = path.dirname( current );
	}

	// Fallback to the start directory if no package.json found.
	return startDir;
}

/**
 * Reads package.json info using Node's module resolution.
 *
 * @param {string}      fullPackageName The full package name (e.g. '@wordpress/blocks').
 * @param {string|null} resolveDir      Optional directory context for resolution.
 * @return {{wpScript?: boolean, wpScriptModuleExports?: string|Object}|null} Package metadata when resolvable.
 */
function getPackageInfo( fullPackageName, resolveDir = null ) {
	const packageRoot = resolveDir
		? findPackageRoot( resolveDir )
		: process.cwd();
	const cacheKey = `${ fullPackageName }@${ packageRoot }`;

	if ( packageJsonCache.has( cacheKey ) ) {
		return packageJsonCache.get( cacheKey );
	}

	const contextPath = path.join( packageRoot, 'package.json' );
	const contextRequire = createRequire( contextPath );

	let resolved;
	try {
		resolved = contextRequire.resolve(
			`${ fullPackageName }/package.json`
		);
	} catch ( error ) {
		const code = error.code;
		if (
			code === 'MODULE_NOT_FOUND' ||
			code === 'ERR_PACKAGE_PATH_NOT_EXPORTED'
		) {
			packageJsonCache.set( cacheKey, null );
			return null;
		}
		throw error;
	}

	const result = getPackageInfoFromFile( resolved );
	packageJsonCache.set( cacheKey, result );

	return result;
}

/**
 * Reads package.json info from an explicit file path.
 *
 * @param {string} packageJsonPath Absolute path to package.json file.
 * @return {{wpScript?: boolean, wpScriptModuleExports?: string|Object}|null} Package metadata when resolvable.
 */
function getPackageInfoFromFile( packageJsonPath ) {
	if ( packagePathCache.has( packageJsonPath ) ) {
		return packagePathCache.get( packageJsonPath );
	}
	const packageJson = JSON.parse( readFileSync( packageJsonPath, 'utf8' ) );
	packagePathCache.set( packageJsonPath, packageJson );
	return packageJson;
}

/**
 * Read package metadata for an import request.
 *
 * @param {string} request Module request (the module name in `import from`).
 * @return {{wpScript?: boolean, wpScriptModuleExports?: string|Object}|undefined} Package metadata when resolvable.
 */
function getPackageMetadata( request ) {
	const packageName = getPackageNameFromRequest( request );

	if ( ! packageName ) {
		return;
	}

	return getPackageInfo( packageName );
}

/**
 * Determine whether a package should stay bundled in script builds.
 * Packages are bundled only when they explicitly opt out of script registration
 * via `wpScript: false`.
 *
 * @param {string} request Module request (the module name in `import from`).
 * @return {boolean} True when package should remain bundled in scripts.
 */
function isBundledPackageForScripts( request ) {
	const packageMetadata = getPackageMetadata( request );
	if ( ! packageMetadata ) {
		return false;
	}

	return packageMetadata.wpScript === false;
}

/**
 * Extract package name (`@scope/name`) from an import request.
 *
 * @param {string} request Module request (the module name in `import from`).
 * @return {string|undefined} Package name when request is namespaced.
 */
function getPackageNameFromRequest( request ) {
	const parts = request.split( '/' );
	if ( parts[ 0 ]?.startsWith( '@' ) && parts.length >= 2 ) {
		return `${ parts[ 0 ] }/${ parts[ 1 ] }`;
	}
}

/**
 * Default request to global transformation
 *
 * Transform @wordpress dependencies:
 * - request `@wordpress/api-fetch` becomes `[ 'wp', 'apiFetch' ]`
 * - request `@wordpress/i18n` becomes `[ 'wp', 'i18n' ]`
 *
 * @param {string} request Module request (the module name in `import from`) to be transformed
 * @return {string|string[]|undefined} The resulting external definition. Return `undefined`
 *   to ignore the request. Return `string|string[]` to map the request to an external.
 */
function defaultRequestToExternal( request ) {
	switch ( request ) {
		case 'moment':
			return request;

		case '@babel/runtime/regenerator':
			return 'regeneratorRuntime';

		case 'lodash':
		case 'lodash-es':
			return 'lodash';

		case 'jquery':
			return 'jQuery';

		case 'react':
			return 'React';

		case 'react-dom':
		case 'react-dom/client':
			return 'ReactDOM';

		case 'react/jsx-runtime':
		case 'react/jsx-dev-runtime':
			return 'ReactJSXRuntime';
	}

	if ( request.includes( 'react-refresh/runtime' ) ) {
		return 'ReactRefreshRuntime';
	}

	if ( isBundledPackageForScripts( request ) ) {
		return undefined;
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return [
			'wp',
			camelCaseDash( request.substring( WORDPRESS_NAMESPACE.length ) ),
		];
	}
}

/**
 * Default request to external module transformation
 *
 * Currently only @wordpress/interactivity and `@wordpress/interactivity-router`
 * are supported.
 *
 * Do not use the boolean shorthand here, it's only handled for the
 * `requestToExternalModule` option.
 *
 * @param {string} request Module request (the module name in `import from`) to be transformed
 * @return {string|Error|undefined} The resulting external definition.
 *   - Return `undefined` to ignore the request (do not externalize).
 *   - Return `string` to map the request to an external.
 *   - Return `Error` to emit an error.
 */
function defaultRequestToExternalModule( request ) {
	if ( request === '@wordpress/interactivity' ) {
		// This is a special case. Interactivity does not support dynamic imports at
		// this time. We add the external "module" type to indicate that webpack
		// should externalize this as a module (instead of our default `import()`
		// external type) which forces @wordpress/interactivity imports to be
		// hoisted to static imports.
		return `module ${ request }`;
	}

	switch ( request ) {
		case '@wordpress/interactivity-router':
		case '@wordpress/a11y':
			return `import ${ request }`;
	}

	const isWordPressScript = Boolean( defaultRequestToExternal( request ) );

	if ( isWordPressScript ) {
		throw new Error(
			`Attempted to use WordPress script in a module: ${ request }, which is not supported yet.`
		);
	}
}

/**
 * Default request to WordPress script handle transformation
 *
 * Transform @wordpress dependencies:
 * - request `@wordpress/i18n` becomes `wp-i18n`
 * - request `@wordpress/escape-html` becomes `wp-escape-html`
 *
 * @param {string} request Module request (the module name in `import from`) to be transformed
 * @return {string|undefined} WordPress script handle to map the request to. Return `undefined`
 *   to use the same name as the module.
 */
function defaultRequestToHandle( request ) {
	switch ( request ) {
		case '@babel/runtime/regenerator':
			return 'regenerator-runtime';

		case 'lodash-es':
			return 'lodash';

		case 'react-dom/client':
			return 'react-dom';

		case 'react/jsx-runtime':
			return 'react-jsx-runtime';
	}

	if ( request.includes( 'react-refresh/runtime' ) ) {
		return 'wp-react-refresh-runtime';
	}

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return 'wp-' + request.substring( WORDPRESS_NAMESPACE.length );
	}
}

/**
 * Given a string, returns a new string with dash separators converted to
 * camelCase equivalent. This is not as aggressive as `_.camelCase` in
 * converting to uppercase, where Lodash will also capitalize letters
 * following numbers.
 *
 * @param {string} string Input dash-delimited string.
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace( /-([a-z])/g, ( _, letter ) => letter.toUpperCase() );
}

module.exports = {
	camelCaseDash,
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
};
