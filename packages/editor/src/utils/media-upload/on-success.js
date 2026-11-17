import { dispatch } from '@wordpress/data';
import { store as coreDataStore } from '@wordpress/core-data';
import { consumeFinalizedAttachment } from './finalized-attachments';

/**
 * Brings core-data's copy of an uploaded attachment up to date, so that blocks
 * see the data the server produced after the upload itself (e.g.
 * `media_details.sizes`, once the sub-sizes have been generated).
 *
 * A client-side upload ends with a `finalize` request whose response already
 * carries the finished record, and that response has been stored by then, so
 * there is nothing left to fetch. An upload the server processed on its own
 * never goes through `finalize`, so its record is invalidated and refetched.
 *
 * @param {Object[]} attachments Array of attachment objects from the upload queue.
 */
export default function mediaUploadOnSuccess( attachments ) {
	const { invalidateResolution } = dispatch( coreDataStore );
	for ( const attachment of attachments ) {
		if ( ! attachment.id || consumeFinalizedAttachment( attachment.id ) ) {
			continue;
		}

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
