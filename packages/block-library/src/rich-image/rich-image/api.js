/**
 * WordPress dependencies
 */

import apiFetch from '@wordpress/api-fetch';

// Note this always happens with the original media ID. This way the rotation is consistent (otherwise we rotate an already rotated image)
export default function richImageRequest( id, action, attrs ) {
	return apiFetch( {
		path: `__experimental/richimage/${ id }/${ action }`,
		headers: {
			'Content-type': 'application/json',
		},
		method: 'POST',
		body: JSON.stringify( attrs ),
	} );
}
