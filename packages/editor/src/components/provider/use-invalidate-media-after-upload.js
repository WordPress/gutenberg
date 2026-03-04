/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { usePrevious } from '@wordpress/compose';
import { store as uploadStore } from '@wordpress/upload-media';
import { store as coreDataStore } from '@wordpress/core-data';

const EMPTY_ARRAY = [];

function getAttachmentIds( items ) {
	const ids = new Set();
	for ( const item of items ) {
		if ( item.attachment?.id ) {
			ids.add( item.attachment.id );
		}
	}
	return ids;
}

/**
 * After client-side media processing completes, the entity store has stale
 * attachment data (empty `media_details.sizes`) because the initial upload
 * uses `generate_sub_sizes: false`. This hook watches the upload queue and
 * invalidates each attachment's entity record once its item (including any
 * sideloads) is removed from the queue, so blocks re-fetch updated data.
 *
 * When client-side media processing is not enabled, invalidation is handled
 * by `receiveEntityRecords` in the `onFileChange` callback of
 * `packages/editor/src/utils/media-upload/index.js`.
 */
export default function useInvalidateMediaAfterUpload() {
	const items = useSelect( ( select ) => {
		if ( ! window.__clientSideMediaProcessing ) {
			return EMPTY_ARRAY;
		}
		return select( uploadStore ).getItems();
	}, [] );

	const previousItems = usePrevious( items );
	const { invalidateResolution } = useDispatch( coreDataStore );

	useEffect( () => {
		if ( ! window.__clientSideMediaProcessing || ! previousItems ) {
			return;
		}

		const currentIds = getAttachmentIds( items );
		const previousIds = getAttachmentIds( previousItems );

		for ( const id of previousIds ) {
			if ( ! currentIds.has( id ) ) {
				// Invalidate with and without the query argument, since
				// resolution keys must exactly match the args used by
				// each consumer's getEntityRecord() call.
				invalidateResolution( 'getEntityRecord', [
					'postType',
					'attachment',
					id,
					{ context: 'view' }, // Used by the image block.
				] );
				invalidateResolution( 'getEntityRecord', [
					'postType',
					'attachment',
					id, // Used by the editor's mediaUpload onFileChange.
				] );
			}
		}
	}, [ items, previousItems, invalidateResolution ] );
}
