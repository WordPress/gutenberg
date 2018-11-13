/**
 * Node dependencies
 */
import { join } from 'path';

const {
	WP_BASE_URL = 'http://localhost:8889',
} = process.env;

export function getUrl( WPPath, query = '' ) {
	const url = new URL( WP_BASE_URL );

	url.pathname = join( url.pathname, WPPath );
	url.search = query;

	return url.href;
}
