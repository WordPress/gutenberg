/**
 * WordPress dependencies
 */
import { dispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Invalidates core-data entity records for uploaded attachments so that
 * blocks re-fetch updated data (e.g. `media_details.sizes` after
 * thumbnails have been generated via client-side media processing).
 *
 * @param {Object[]} attachments Array of attachment objects from the upload queue.
 */
export default function mediaUploadOnSuccess( attachments ) {
	const { invalidateResolution } = dispatch( coreDataStore );
	for ( const attachment of attachments ) {
		if ( attachment.id ) {
			// Invalidate with and without the query argument, since
			// resolution keys must exactly match the args used by
			// each consumer's getEntityRecord() call.
			invalidateResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				attachment.id,
				{ context: 'view' },
			] );
			invalidateResolution( 'getEntityRecord', [
				'postType',
				'attachment',
				attachment.id,
			] );
		}
	}
}
