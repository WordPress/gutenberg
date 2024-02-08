import fetch from '@wordpress/api-fetch';

export function fetchEntities() {
	return fetch( { path: '/wp/v2/search' } );
}
