import apiFetch from '@wordpress/api-fetch';
import { transformAttachment } from '@wordpress/media-utils';
import { receiveFinalizedAttachment } from '../media-upload/finalized-attachments';

export default async function mediaFinalize( id, subSizes = [] ) {
	const response = await apiFetch( {
		path: `/wp/v2/media/${ id }/finalize`,
		method: 'POST',
		data: { sub_sizes: subSizes },
	} );

	if ( ! response ) {
		return undefined;
	}

	// The finalize response is the attachment as prepared after its sub-size
	// metadata was written, so it is the record the editor should be holding.
	// Storing it here means the upload does not have to fetch the attachment
	// again to pick the sizes up - a refetch that can be served the pre-finalize
	// record either by an out-of-order response or by a host cache keyed on the
	// request URL. See https://github.com/WordPress/gutenberg/issues/81844.
	receiveFinalizedAttachment( response );

	// Returning the post-finalize attachment lets callers refresh the block
	// URL (via onChange) so it points at the scaled file and srcset matches.
	return transformAttachment( response );
}
