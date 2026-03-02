/**
 * WordPress dependencies
 */
import { useSelect, useRegistry } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Recursively extracts image attachment IDs from blocks.
 *
 * @param {Array} blocks List of blocks to search.
 * @return {Set<number>} Set of attachment IDs found.
 */
function getImageAttachmentIds( blocks ) {
	const ids = new Set();
	for ( const block of blocks ) {
		if ( block.name === 'core/image' && block.attributes.id ) {
			ids.add( block.attributes.id );
		}
		if ( block.name === 'core/media-text' && block.attributes.mediaId ) {
			ids.add( block.attributes.mediaId );
		}
		if ( block.name === 'core/cover' && block.attributes.id ) {
			ids.add( block.attributes.id );
		}
		if ( block.innerBlocks?.length ) {
			for ( const id of getImageAttachmentIds( block.innerBlocks ) ) {
				ids.add( id );
			}
		}
	}
	return ids;
}

/**
 * A hook that checks for images with missing sub-sizes when the editor loads.
 *
 * When client-side media processing is enabled and images in the post have
 * incomplete sub-sizes (e.g., from a prior interrupted upload), this hook
 * queues client-side thumbnail generation for those missing sizes.
 *
 * Only active when client-side media processing is enabled.
 */
export default function useMissingSizesCheck() {
	const [ hasChecked, setHasChecked ] = useState( false );
	const isEnabled = window.__clientSideMediaProcessing;
	const registry = useRegistry();

	const blocks = useSelect(
		( select ) => {
			if ( ! isEnabled ) {
				return [];
			}
			return select( blockEditorStore ).getBlocks();
		},
		[ isEnabled ]
	);

	useEffect( () => {
		if ( ! isEnabled || hasChecked || ! blocks.length ) {
			return;
		}
		setHasChecked( true );

		const attachmentIds = getImageAttachmentIds( blocks );
		if ( ! attachmentIds.size ) {
			return;
		}

		( async () => {
			for ( const attachmentId of attachmentIds ) {
				try {
					const attachment = await registry
						.resolveSelect( coreStore )
						.getEntityRecord(
							'postType',
							'attachment',
							attachmentId,
							{
								context: 'edit',
							}
						);

					if (
						attachment?.missing_image_sizes?.length &&
						attachment.source_url
					) {
						unlock(
							registry.dispatch( uploadStore )
						).queueMissingSizeGeneration( {
							attachmentId: attachment.id,
							sourceUrl: attachment.source_url,
							missingSizes: attachment.missing_image_sizes,
						} );
					}
				} catch {
					// Silently skip attachments that can't be fetched.
				}
			}
		} )();
	}, [ isEnabled, hasChecked, blocks, registry ] );
}
