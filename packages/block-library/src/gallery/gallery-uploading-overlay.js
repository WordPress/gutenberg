/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { ProgressBar } from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
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
	// Track the initial total when uploads start so we can show progress
	// even as items leave the queue.
	const [ initialTotal, setInitialTotal ] = useState( 0 );

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

	// Don't render if there aren't multiple concurrent uploads.
	if ( initialTotal < 2 || topLevelCount === 0 ) {
		return null;
	}

	return (
		<div
			className="wp-block-gallery__upload-overlay"
			role="progressbar"
			aria-label={ __( 'Upload progress' ) }
			aria-valuenow={ averageProgress }
			aria-valuemin={ 0 }
			aria-valuemax={ 100 }
		>
			<ProgressBar value={ averageProgress } />
		</div>
	);
}
