/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default async function mediaDelete( id ) {
	await apiFetch( {
		path: `/wp/v2/media/${ id }?force=true`,
		method: 'DELETE',
	} );
}
