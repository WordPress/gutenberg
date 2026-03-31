/**
 * WordPress dependencies
 */
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { ProgressBar, Button } from '@wordpress/components';
import { useEffect, useRef, useCallback, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as uploadMediaStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/**
 * Component that displays a single consolidated upload progress overlay
 * on the gallery block when multiple images are being uploaded as a batch.
 */
export default function GalleryUploadingOverlay() {
	const overlayRef = useRef();
	// Track the initial total when uploads start so we can show "X of Y"
	// even as items leave the queue.
	const [ initialTotal, setInitialTotal ] = useState( 0 );

	// When the overlay unmounts, return focus to the gallery block.
	useEffect( () => {
		const overlay = overlayRef.current;
		return () => {
			if (
				overlay &&
				overlay.contains( overlay.ownerDocument.activeElement )
			) {
				overlay.closest( '[data-block]' )?.focus();
			}
		};
	}, [] );

	const { topLevelCount, averageProgress } = useSelect( ( select ) => {
		const { getAllItems } = unlock( select( uploadMediaStore ) );
		const allItems = getAllItems();

		// Only count top-level uploads, not child sideload items
		// (thumbnail generation). Child items have a parentId.
		const topLevel = allItems.filter( ( item ) => ! item.parentId );

		if ( topLevel.length === 0 ) {
			return {
				topLevelCount: 0,
				averageProgress: 0,
			};
		}

		const totalProgress = topLevel.reduce(
			( sum, item ) => sum + ( item.progress ?? 0 ),
			0
		);
		const avg = Math.round( totalProgress / topLevel.length );

		return {
			topLevelCount: topLevel.length,
			averageProgress: avg,
		};
	}, [] );

	// Track the peak number of top-level items as the batch total.
	useEffect( () => {
		if ( topLevelCount > 1 && topLevelCount > initialTotal ) {
			setInitialTotal( topLevelCount );
		}
		// Reset when all uploads complete.
		if ( topLevelCount === 0 ) {
			setInitialTotal( 0 );
		}
	}, [ topLevelCount, initialTotal ] );

	const { cancelItem } = useDispatch( uploadMediaStore );
	const registry = useRegistry();

	const handleCancel = useCallback( () => {
		const { getAllItems } = unlock( registry.select( uploadMediaStore ) );
		const items = getAllItems();
		for ( const item of items ) {
			cancelItem(
				item.id,
				new Error( __( 'Upload cancelled by user' ) )
			);
		}
	}, [ cancelItem, registry ] );

	// Don't render if there aren't multiple concurrent uploads.
	if ( initialTotal < 2 || topLevelCount === 0 ) {
		return null;
	}

	const completedCount = initialTotal - topLevelCount;
	const currentImage = Math.min( completedCount + 1, initialTotal );

	const label = sprintf(
		/* translators: 1: current image number, 2: total images in batch */
		__( 'Processing image %1$d of %2$d' ),
		currentImage,
		initialTotal
	);

	return (
		<div
			className="wp-block-gallery__upload-overlay"
			role="status"
			ref={ overlayRef }
		>
			<ProgressBar
				value={ averageProgress }
				aria-label={ __( 'Upload progress' ) }
			/>
			<span className="wp-block-gallery__upload-overlay-label">
				{ label }
			</span>
			<Button
				__next40pxDefaultSize
				variant="secondary"
				onClick={ handleCancel }
			>
				{ __( 'Cancel' ) }
			</Button>
		</div>
	);
}
