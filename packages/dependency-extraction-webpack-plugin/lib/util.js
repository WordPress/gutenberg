const WORDPRESS_NAMESPACE = '@wordpress/';

// !!
// This list must be kept in sync with the same list in tools/webpack/packages.js
// !!
const BUNDLED_PACKAGES = [
	'@wordpress/dataviews',
	'@wordpress/icons',
	'@wordpress/interface',
	'@wordpress/sync',
	'@wordpress/undo-manager',
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
			return 'ReactDOM';
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

	if ( request === '@wordpress/interactivity-router' ) {
		// Assumes this is usually going to be used as a dynamic import.
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
			return 'wp-polyfill';

		case 'lodash-es':
			return 'lodash';
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
