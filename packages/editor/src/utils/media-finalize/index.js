import apiFetch from '@wordpress/api-fetch';
import { transformAttachment } from '@wordpress/media-utils';

/**
 * Finalizes a client-side processed attachment.
 *
 * @param id         Attachment ID.
 * @param subSizes   Sub-size metadata collected from sideloads.
 * @param clientData Optional plugin data sent as `client_extended_data` (e.g. encode qualities).
 * @return Transformed attachment from the finalize response, when present.
 */
export default async function mediaFinalize(
	id,
	subSizes = [],
	clientData = {}
) {
	const data = { sub_sizes: subSizes };
	if (
		clientData &&
		typeof clientData === 'object' &&
		! Array.isArray( clientData ) &&
		Object.keys( clientData ).length > 0
	) {
		data.client_extended_data = clientData;
	}

	const response = await apiFetch( {
		path: `/wp/v2/media/${ id }/finalize`,
		method: 'POST',
		data,
	} );

	// Returning the post-finalize attachment lets callers refresh the block
	// URL (via onChange) so it points at the scaled file and srcset matches.
	return response ? transformAttachment( response ) : undefined;
}
