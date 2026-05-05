/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';

export default async function mediaFinalize( id, subSizes = [] ) {
	await apiFetch( {
		path: `/wp/v2/media/${ id }/finalize`,
		method: 'POST',
		data: { sub_sizes: subSizes },
	} );
}
