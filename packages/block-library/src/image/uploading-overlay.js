/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ProgressBar, Button } from '@wordpress/components';
import { useEffect, useRef } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as uploadMediaStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/**
 * Gets a user-friendly label for an upload operation.
 *
 * Values correspond to the OperationType enum in @wordpress/upload-media,
 * which is not publicly exported. The string values are stable since they
 * are persisted in the store.
 *
 * @param {string|undefined} operation The current operation type.
 * @return {string} The localized label for the operation.
 */
export function getOperationLabel( operation ) {
	switch ( operation ) {
		case 'PREPARE':
			return __( 'Preparing…' );
		case 'UPLOAD':
			return __( 'Uploading…' );
		case 'RESIZE_CROP':
			return __( 'Resizing…' );
		case 'ROTATE':
			return __( 'Rotating…' );
		case 'TRANSCODE_IMAGE':
			return __( 'Compressing…' );
		case 'THUMBNAIL_GENERATION':
			return __( 'Generating thumbnails…' );
		case 'FINALIZE':
			return __( 'Finalizing…' );
		default:
			return __( 'Processing…' );
	}
}

/**
 * Component that displays upload progress overlay on the image block.
 *
 * @param {Object}   props              Component props.
 * @param {string}   props.url          The blob URL of the uploading image.
 * @param {number}   props.attachmentId The attachment ID, used as fallback when url is not available.
 * @param {Function} props.onCancel     Callback when cancel button is clicked.
 */
export default function UploadingOverlay( { url, attachmentId, onCancel } ) {
	const overlayRef = useRef();

	// When the overlay unmounts, return focus to the block wrapper if focus
	// was inside the overlay (e.g. on the Cancel button). This prevents
	// focus from being lost to the document body.
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

	const {
		progress,
		currentOperation,
		itemId,
		batchSize,
		batchIndex,
		thumbnailCount,
		remainingThumbnails,
	} = useSelect(
		( select ) => {
			const {
				getItemByBlobUrl,
				getItemByAttachmentId,
				getChildItemCount,
			} = unlock( select( uploadMediaStore ) );
			const item =
				( url && getItemByBlobUrl( url ) ) ||
				( attachmentId && getItemByAttachmentId( attachmentId ) ) ||
				undefined;

			return {
				progress: item?.progress,
				currentOperation: item?.currentOperation,
				itemId: item?.id,
				batchSize: item?.batchSize,
				batchIndex: item?.batchIndex,
				thumbnailCount: item?.thumbnailCount ?? 0,
				remainingThumbnails: item?.id
					? getChildItemCount( item.id )
					: 0,
			};
		},
		[ url, attachmentId ]
	);

	const { cancelItem } = useDispatch( uploadMediaStore );

	const handleCancel = () => {
		if ( itemId ) {
			cancelItem( itemId, new Error( __( 'Upload cancelled by user' ) ) );
		}
		onCancel?.();
	};

	// Convert progress from 0-100 to percentage for display
	const progressValue =
		typeof progress === 'number' ? Math.round( progress ) : undefined;

	let label;
	if ( thumbnailCount > 0 && remainingThumbnails > 0 ) {
		const current = thumbnailCount - remainingThumbnails + 1;
		label = sprintf(
			/* translators: 1: current subsize number, 2: total subsizes */
			__( 'Generating subsize %1$d of %2$d' ),
			current,
			thumbnailCount
		);
	} else if ( batchSize > 1 ) {
		label = sprintf(
			/* translators: 1: current image number, 2: total images in batch */
			__( 'Image %1$d of %2$d' ),
			batchIndex,
			batchSize
		);
	} else {
		label = getOperationLabel( currentOperation );
	}

	return (
		<div
			className="wp-block-image__upload-overlay"
			role="status"
			ref={ overlayRef }
		>
			<ProgressBar
				value={ progressValue }
				aria-label={ __( 'Upload progress' ) }
			/>
			<span className="wp-block-image__upload-overlay-label">
				{ label }
				{ typeof progressValue === 'number' && ` ${ progressValue }%` }
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
