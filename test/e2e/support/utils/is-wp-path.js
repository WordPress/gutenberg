/**
 * Node dependencies
 */
import { URL } from 'url';

/**
 * Internal dependencies
 */
import { getUrl } from './get-url';

/**
 * Checks if current url is a WordPress path.
 *
 * @param {string} WPPath String to be serialized as pathname.
 * @param {?string} query String to be serialized as query portion of URL.
 * @return {boolean} Boolean represents wheter current URL is or not a WordPress path.
 */
export function isWPPath( WPPath, query = '' ) {
	const currentUrl = new URL( page.url() );

	currentUrl.search = query;

	return getUrl( WPPath ) === currentUrl.href;
}
