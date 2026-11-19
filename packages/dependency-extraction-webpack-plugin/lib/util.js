const WORDPRESS_NAMESPACE = '@wordpress/';
const BUNDLED_PACKAGES = [
	'@wordpress/admin-ui',
	'@wordpress/dataviews',
	'@wordpress/dataviews/wp',
	'@wordpress/fields',
	'@wordpress/global-styles-engine',
	'@wordpress/global-styles-ui',
	'@wordpress/grid',
	'@wordpress/icons',
	'@wordpress/image-editor',
	'@wordpress/interface',
	'@wordpress/kebab-case',
	'@wordpress/react-inert-value',
	'@wordpress/style-runtime',
	'@wordpress/sync',
	'@wordpress/ui',
	'@wordpress/undo-manager',
	'@wordpress/views',
];

/**
 * Default request to global transformation
 *
 * Transform `@wordpress/*` dependencies:
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
 * Currently only `@wordpress/interactivity`, `@wordpress/interactivity-router`,
 * and `@wordpress/a11y` are supported. Each maps to its own script module ID,
 * which every import of it keeps: a static `import` declaration stays static
 * and an `import()` stays dynamic.
 *
 * Do not use the boolean shorthand here, it's only handled for the
 * `requestToExternalModule` option.
 *
 * @param {string} request Module request (the module name in `import from`) to be transformed
 * @return {string|undefined} The resulting external definition.
 *   - Return `undefined` to ignore the request (do not externalize).
 *   - Return `string` to map the request to an external.
 * @throws {Error} When the request is a WordPress script, which script modules can't import.
 */
function defaultRequestToExternalModule( request ) {
	switch ( request ) {
		case '@wordpress/interactivity':
		case '@wordpress/interactivity-router':
		case '@wordpress/a11y':
			return request;
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
 * Transform `@wordpress/*` dependencies:
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
