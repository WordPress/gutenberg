/**
 * WordPress dependencies
 */
import { Button, Flex, FlexItem, Modal } from '@wordpress/components';
import { Stack } from '@wordpress/ui';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { switchToBlockType } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { useRegistry, useSelect } from '@wordpress/data';
import { useEffect, useMemo, useRef } from '@wordpress/element';
import { __, _n } from '@wordpress/i18n';
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
 * Whether the GIF conversion prompt is currently shown: there are animated
 * GIF uploads awaiting a decision.
 *
 * Shared with the upload progress snackbar, which stays hidden while the
 * prompt is open so the prompt is the single point of attention.
 *
 * @return {boolean} Whether the prompt is visible.
 */
export function useIsGifConversionPromptVisible() {
	return useSelect(
		( select ) =>
			unlock( select( uploadStore ) )
				.getGifConversions()
				.some( ( conversion ) => conversion.status === 'pending' ),
		[]
	);
}

/**
 * Asks the user whether a dropped animated GIF should be converted to a
 * video (the Video block's GIF variation) or stay a GIF.
 *
 * The prompt appears as soon as the file is identified as a conversion
 * candidate — before the upload finishes — so it reads as part of the drop
 * action. Uploads themselves are never blocked: the GIF uploads as a plain
 * image in the background while this prompt is open, and the answer only
 * decides whether a companion video is transcoded and the block swapped.
 */
export default function GifConversionPrompt() {
	const registry = useRegistry();
	const conversions = useSelect(
		( select ) => unlock( select( uploadStore ) ).getGifConversions(),
		[]
	);
	const convertButtonRef = useRef();
	// Conversion records whose block swap is already running, so a re-render
	// while the async swap is in flight doesn't start a second one.
	const swappingRef = useRef( new Set() );

	const pending = useMemo(
		() =>
			conversions.filter(
				( conversion ) => conversion.status === 'pending'
			),
		[ conversions ]
	);
	const converted = useMemo(
		() =>
			conversions.filter(
				( conversion ) => conversion.status === 'converted'
			),
		[ conversions ]
	);

	// Once a conversion finishes, swap the corresponding Image blocks to the
	// Video block's GIF variation and drop the record.
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

	const isModalVisible = pending.length > 0;

	// Steer towards converting: focus the primary button so Enter converts.
	useEffect( () => {
		if ( isModalVisible ) {
			convertButtonRef.current?.focus();
		}
	}, [ isModalVisible ] );

	if ( ! isModalVisible ) {
		return null;
	}

	const count = pending.length;

	const resolveAll = ( decision ) => {
		const { resolveGifConversion } = unlock(
			registry.dispatch( uploadStore )
		);
		for ( const { itemId } of pending ) {
			resolveGifConversion( itemId, decision );
		}
	};

	return (
		<Modal
			title={ _n( 'Convert to video', 'Convert to videos', count ) }
			// Closing the dialog keeps the GIF for this upload.
			onRequestClose={ () => resolveAll( 'gif' ) }
			size="small"
			focusOnMount={ false }
		>
			<Stack direction="column" gap="lg">
				<p>
					{ _n(
						'This will save space without changing the visuals. The GIF stays in your media library.',
						'This will save space without changing the visuals. The GIFs stay in your media library.',
						count
					) }
				</p>
				<Flex direction="row" justify="flex-end">
					<FlexItem>
						<Button
							variant="tertiary"
							__next40pxDefaultSize
							onClick={ () => resolveAll( 'gif' ) }
						>
							{ __( 'Not now' ) }
						</Button>
					</FlexItem>
					<FlexItem>
						<Button
							variant="primary"
							__next40pxDefaultSize
							ref={ convertButtonRef }
							onClick={ () => resolveAll( 'video' ) }
						>
							{ __( 'Convert' ) }
						</Button>
					</FlexItem>
				</Flex>
			</Stack>
		</Modal>
	);
}
