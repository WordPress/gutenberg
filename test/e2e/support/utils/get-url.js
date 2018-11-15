/**
 * Node dependencies
 */
import { join } from 'path';

import { WP_BASE_URL } from './config';

export function getUrl( WPPath, query = '' ) {
	const url = new URL( WP_BASE_URL );

	url.pathname = join( url.pathname, WPPath );
	url.search = query;

	return url.href;
}
