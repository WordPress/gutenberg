/**
 * Internal dependencies
 */
import { WP_BASE_URL } from '../config';
import type { PageUtils } from './';

/**
 * Checks if current path of the URL matches the provided path.
 *
 * @param this
 * @param path String to be serialized as pathname.
 *
 * @return Boolean represents whether current URL is or not a WordPress path.
 */
export function isCurrentURL( this: PageUtils, path: string ) {
	const currentURL = new URL( this.page.url() );
	const expectedURL = new URL( path, WP_BASE_URL );

	return expectedURL.pathname === currentURL.pathname;
}
