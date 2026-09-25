import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { cloneBlock } from '@wordpress/blocks';
import { useSelect, useDispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { isBlobURL } from '@wordpress/blob';
import { getFilename } from '@wordpress/url';
import { store as blockEditorStore } from '../../../store';

const ALLOWED_MEDIA_TYPES = [ 'image' ];

/**
 * Inserts a media block from the inserter, uploading external media into the
 * library first where possible.
 *
 * Library items insert straight away. External items (no `id`) are fetched
 * and uploaded, then inserted once the upload resolves; if the upload can't
 * happen (no permission, or the host blocks the fetch) the caller is handed a
 * `pendingExternalBlock` to confirm inserting as an external image.
 *
 * @param {Function} onInsert Called with the block to insert.
 * @return {{
 *   insert: (block: Object, itemId?: string|number) => void,
 *   insertingId: string|number|undefined,
 *   pendingExternalBlock: Object|undefined,
 *   confirmExternalInsert: () => void,
 *   cancelExternalInsert: () => void,
 * }} The insert callback and its state.
 */
export function useMediaInsert( onInsert ) {
	// The id of the item whose upload is in flight, so a grid can show a
	// spinner on that item alone and further inserts are ignored meanwhile.
	const [ insertingId, setInsertingId ] = useState();
	const [ pendingExternalBlock, setPendingExternalBlock ] = useState();
	const { createErrorNotice, createSuccessNotice } =
		useDispatch( noticesStore );
	const { getSettings, getBlock } = useSelect( blockEditorStore );
	const { updateBlockAttributes } = useDispatch( blockEditorStore );

	const insert = useCallback(
		( previewBlock, itemId ) => {
			// Prevent multiple uploads when we're in the process of inserting.
			if ( insertingId !== undefined ) {
				return;
			}

			const settings = getSettings();
			const clonedBlock = cloneBlock( previewBlock );
			const { id, url, caption } = clonedBlock.attributes;

			// User has no permission to upload media.
			if ( ! id && ! settings.mediaUpload ) {
				setPendingExternalBlock( previewBlock );
				return;
			}

			// Media item already exists in library, so just insert it.
			if ( !! id ) {
				onInsert( clonedBlock );
				return;
			}

			setInsertingId( itemId ?? url );
			// Media item does not exist in library, so try to upload it.
			// Fist fetch the image data. This may fail if the image host
			// doesn't allow CORS with the domain.
			// If this happens, we insert the image block using the external
			// URL and let the user know about the possible implications.
			window
				.fetch( url )
				.then( ( response ) => response.blob() )
				.then( ( blob ) => {
					const fileName = getFilename( url ) || 'image.jpg';
					const file = new File( [ blob ], fileName, {
						type: blob.type,
					} );

					settings.mediaUpload( {
						filesList: [ file ],
						additionalData: { caption },
						onFileChange( [ img ] ) {
							if ( isBlobURL( img.url ) ) {
								return;
							}

							if ( ! getBlock( clonedBlock.clientId ) ) {
								// Ensure the block is only inserted once.
								onInsert( {
									...clonedBlock,
									attributes: {
										...clonedBlock.attributes,
										id: img.id,
										url: img.url,
									},
								} );

								createSuccessNotice(
									__( 'Image uploaded and inserted.' ),
									{ type: 'snackbar', id: 'inserter-notice' }
								);
							} else {
								// For subsequent calls, update the existing block.
								updateBlockAttributes( clonedBlock.clientId, {
									...clonedBlock.attributes,
									id: img.id,
									url: img.url,
								} );
							}

							setInsertingId( undefined );
						},
						allowedTypes: ALLOWED_MEDIA_TYPES,
						onError( message ) {
							createErrorNotice( message, {
								type: 'snackbar',
								id: 'inserter-notice',
							} );
							setInsertingId( undefined );
						},
					} );
				} )
				.catch( () => {
					setPendingExternalBlock( previewBlock );
					setInsertingId( undefined );
				} );
		},
		[
			insertingId,
			getSettings,
			onInsert,
			createSuccessNotice,
			updateBlockAttributes,
			createErrorNotice,
			getBlock,
		]
	);

	const confirmExternalInsert = useCallback( () => {
		onInsert( cloneBlock( pendingExternalBlock ) );
		createSuccessNotice( __( 'Image inserted.' ), {
			type: 'snackbar',
			id: 'inserter-notice',
		} );
		setPendingExternalBlock( undefined );
	}, [ onInsert, pendingExternalBlock, createSuccessNotice ] );

	const cancelExternalInsert = useCallback(
		() => setPendingExternalBlock( undefined ),
		[]
	);

	return {
		insert,
		insertingId,
		pendingExternalBlock,
		confirmExternalInsert,
		cancelExternalInsert,
	};
}
