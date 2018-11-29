/**
 * Internal dependencies
 */
import { getUrl } from './get-url';

/**
 * Navigates to URL created from WPPath and query.
 *
 * @param {string} WPPath String to be serialized as pathname.
 * @param {string} query String to be serialized as query portion of URL.
 */
export async function goToWPPath( WPPath, query ) {
	await page.goto( getUrl( WPPath, query ) );
}
