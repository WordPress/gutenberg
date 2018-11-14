/**
 * Internal dependencies
 */
import { getUrl } from './get-url';

export async function goToWPPath( WPPath, query ) {
	await page.goto( getUrl( WPPath, query ) );
}
