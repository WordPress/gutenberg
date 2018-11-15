/**
 * Internal dependencies
 */
import { getUrl } from './get-url';

export function isWPPath( WPPath, query = '' ) {
	const currentUrl = new URL( page.url() );

	currentUrl.search = query;

	return getUrl( WPPath ) === currentUrl.href;
}
