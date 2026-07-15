/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { switchToBlockType } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { store as uploadStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

/**
 * Swaps every Image block using the given attachment to the Video block's
 * GIF variation, now that the attachment's companion video exists.
 *
 * The attachment record is re-fetched first: the companion is recorded on
 * the server after the original upload completed, so the cached editor
 * record does not include it yet. The swap itself runs the regular
 * Image → Video block transform, which reads that record synchronously.
 *
 * @param {Object} registry     Data registry.
 * @param {number} attachmentId Attachment ID of the converted GIF.
 */
async function swapImageBlocksToVideo( registry, attachmentId ) {
	const queryArgs = [
		'postType',
		'attachment',
		attachmentId,
		{ context: 'view' },
	];
	registry
		.dispatch( coreStore )
		.invalidateResolution( 'getEntityRecord', queryArgs );
	const record = await registry
		.resolveSelect( coreStore )
		.getEntityRecord( ...queryArgs );

	if ( ! record?.media_details?.animated_video ) {
		return;
	}

	const {
		canInsertBlockType,
		getBlockAttributes,
		getBlockName,
		getBlockRootClientId,
		getBlocksByClientId,
		getClientIdsWithDescendants,
	} = registry.select( blockEditorStore );

	const clientIds = getClientIdsWithDescendants().filter(
		( clientId ) =>
			getBlockName( clientId ) === 'core/image' &&
			getBlockAttributes( clientId )?.id === attachmentId
	);

	for ( const clientId of clientIds ) {
		// Skip contexts that disallow the Video block (e.g. a Gallery),
		// matching the availability of the block switcher transform.
		if (
			! canInsertBlockType(
				'core/video',
				getBlockRootClientId( clientId )
			)
		) {
			continue;
		}

		const block = getBlocksByClientId( [ clientId ] )[ 0 ];
		if ( ! block ) {
			continue;
		}

		const newBlocks = switchToBlockType( block, 'core/video' );
		if ( newBlocks?.length ) {
			registry
				.dispatch( blockEditorStore )
				.replaceBlocks( clientId, newBlocks );
		}
	}
}

/**
 * Watches for completed GIF conversions and swaps the corresponding Image
 * blocks to the Video block's GIF variation, then drops the record.
 *
 * Always mounted and deliberately separate from GifConversionPrompt: the
 * transcode finishes after the user has answered and the prompt modal has
 * closed, so the swap cannot live inside the (transient) prompt component.
 */
export default function GifConversionBlockSwapper() {
	const registry = useRegistry();
	const conversions = useSelect(
		( select ) => unlock( select( uploadStore ) ).getGifConversions(),
		[]
	);
	// Records whose block swap is already running, so a re-render while the
	// async swap is in flight doesn't start a second one.
	const swappingRef = useRef( new Set() );

	const converted = useMemo(
		() =>
			conversions.filter(
				( conversion ) => conversion.status === 'converted'
			),
		[ conversions ]
	);

	useEffect( () => {
		if ( ! converted.length ) {
			return;
		}
		const { removeGifConversion } = unlock(
			registry.dispatch( uploadStore )
		);
		for ( const { itemId, attachmentId } of converted ) {
			if ( swappingRef.current.has( itemId ) ) {
				continue;
			}
			swappingRef.current.add( itemId );
			swapImageBlocksToVideo( registry, attachmentId ).finally( () => {
				swappingRef.current.delete( itemId );
				removeGifConversion( itemId );
			} );
		}
	}, [ converted, registry ] );

	return null;
}
