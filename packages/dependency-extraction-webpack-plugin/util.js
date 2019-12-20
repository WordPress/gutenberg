const WORDPRESS_NAMESPACE = '@wordpress/';

/**
 * Default request to global transformation
 *
 * Transform @wordpress dependencies:
 *
 *   request `@wordpress/api-fetch` becomes `wp.apiFetch`
 *   request `@wordpress/i18n` becomes `wp.i18n`
 *
 * @param {string} request Requested module
 *
 * @return {(string|string[]|undefined)} Script global
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

	if ( request.startsWith( WORDPRESS_NAMESPACE ) ) {
		return [ 'wp', camelCaseDash( request.substring( WORDPRESS_NAMESPACE.length ) ) ];
	}
}

/**
 * Default request to WordPress script handle transformation
 *
 * Transform @wordpress dependencies:
 *
 *   request `@wordpress/i18n` becomes `wp-i18n`
 *   request `@wordpress/escape-html` becomes `wp-escape-html`
 *
 * @param {string} request Requested module
 *
 * @return {(string|undefined)} Script handle
 */
function defaultRequestToHandle( request ) {
	switch ( request ) {
		case '@babel/runtime/regenerator':
			return 'wp-polyfill';

		case 'lodash-es':
			return 'lodash';
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
 * Temporarily duplicated from @wordpress/scripts/utils.
 *
 * @param {string} string Input dash-delimited string.
 *
 * @return {string} Camel-cased string.
 */
function camelCaseDash( string ) {
	return string.replace( /-([a-z])/g, ( match, letter ) => letter.toUpperCase() );
}

module.exports = {
	defaultRequestToExternal,
	defaultRequestToHandle,
};
