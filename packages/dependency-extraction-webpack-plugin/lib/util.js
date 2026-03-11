const { readFileSync } = require( 'fs' );
const { createRequire } = require( 'module' );
const path = require( 'path' );

const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [
	'@wordpress/admin-ui',
	'@wordpress/dataviews',
	'@wordpress/dataviews/wp',
	'@wordpress/fields',
	'@wordpress/grid',
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/style-runtime',
	'@wordpress/ui',
	'@wordpress/undo-manager',
	'@wordpress/views',
];

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

	if ( BUNDLED_PACKAGES.includes( request ) ) {
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

/**
 * Cache for resolved package.json objects.
 *
 * @type {Map<string, Object|null>}
 */
const packageJsonCache = new Map();

/**
 * Resolve and read a package's package.json using Node's module resolution.
 *
 * @param {string} packageName Full package name (e.g., '@wordpress/abilities').
 * @param {string} contextDir  Directory to resolve from (the importing file's directory).
 * @return {Object|null} Parsed package.json object or null if not found.
 */
function getPackageInfo( packageName, contextDir ) {
	const cacheKey = `${ packageName }@${ contextDir }`;
	if ( packageJsonCache.has( cacheKey ) ) {
		return packageJsonCache.get( cacheKey );
	}

	const resolveDirs = [ contextDir, __dirname ];
	for ( const dir of resolveDirs ) {
		try {
			const dirRequire = createRequire(
				path.join( dir, 'package.json' )
			);
			const packageJsonPath = dirRequire.resolve(
				`${ packageName }/package.json`
			);
			const result = JSON.parse(
				readFileSync( packageJsonPath, 'utf8' )
			);
			packageJsonCache.set( cacheKey, result );
			return result;
		} catch {
			// Try next resolution path.
		}
	}

	packageJsonCache.set( cacheKey, null );
	return null;
}

/**
 * Check if a package import is a script module.
 * A package is considered a script module if it has wpScriptModuleExports
 * and the specific import path (root or subpath) is declared in wpScriptModuleExports.
 *
 * Ported from packages/wp-build/lib/wordpress-externals-plugin.mjs.
 *
 * @param {Object}      packageJson Package.json object.
 * @param {string|null} subpath     Subpath after package name, or null for root import.
 * @return {boolean} True if the import is a script module.
 */
function isScriptModuleImport( packageJson, subpath ) {
	const { wpScriptModuleExports } = packageJson;

	if ( ! wpScriptModuleExports ) {
		return false;
	}

	// Root import: @wordpress/package-name
	if ( ! subpath ) {
		if ( typeof wpScriptModuleExports === 'string' ) {
			return true;
		}
		if (
			typeof wpScriptModuleExports === 'object' &&
			wpScriptModuleExports[ '.' ]
		) {
			return true;
		}
		return false;
	}

	// Subpath import: @wordpress/package-name/subpath
	if (
		typeof wpScriptModuleExports === 'object' &&
		wpScriptModuleExports[ `./${ subpath }` ]
	) {
		return true;
	}

	return false;
}

module.exports = {
	camelCaseDash,
	defaultRequestToExternal,
	defaultRequestToExternalModule,
	defaultRequestToHandle,
	getPackageInfo,
	isScriptModuleImport,
};
