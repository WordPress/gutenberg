const URL_REGEXP = /^(?:https?:)?\/\/\S+$/i;

/**
 * Determines whether the given string looks like a URL.
 *
 * @param {string} url The string to scrutinise.
 *
 * @example
 * ```js
 * const isURL = isURL( 'https://wordpress.org' ); // true
 * ```
 *
 * @return {boolean} Whether or not it looks like a URL.
 */
export function isURL( url ) {
	return URL_REGEXP.test( url );
}
