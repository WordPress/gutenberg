/**
 * External dependencies
 */
import { URL } from 'url';

/**
 * Internal dependencies
 */
import { createURL } from './create-url';

/**
 * Checks if current URL is a WordPress path.
 *
 * @param {string} WPPath String to be serialized as pathname.
 * @param {?string} query String to be serialized as query portion of URL.
 * @return {boolean} Boolean represents whether current URL is or not a WordPress path.
 */
export function isCurrentURL( WPPath, query = '' ) {
	const currentURL = new URL( page.url() );

	currentURL.search = query;

	return createURL( WPPath ) === currentURL.href;
}
