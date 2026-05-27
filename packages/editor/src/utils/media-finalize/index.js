/**
 * WordPress dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { transformAttachment } from '@wordpress/media-utils';

export default async function mediaFinalize( id, subSizes = [] ) {
	const response = await apiFetch( {
		path: `/wp/v2/media/${ id }/finalize`,
		method: 'POST',
		data: { sub_sizes: subSizes },
	} );

	// Returning the post-finalize attachment lets callers refresh the block
	// URL (via onChange) so it points at the scaled file and srcset matches.
	return response ? transformAttachment( response ) : undefined;
}
