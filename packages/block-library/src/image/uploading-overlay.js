/**
 * WordPress dependencies
 */
import { useSelect, useDispatch } from '@wordpress/data';
import { ProgressBar, Button } from '@wordpress/components';
import {
	useFocusOnMount,
	useFocusReturn,
	useMergeRefs,
} from '@wordpress/compose';
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
function getOperationLabel( operation ) {
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
 * @param {string}   props.filename     The filename of the uploading image, used for accessible cancel label.
 */
export default function UploadingOverlay( {
	url,
	attachmentId,
	onCancel,
	filename,
} ) {
	const focusOnMountRef = useFocusOnMount( 'firstElement' );
	const focusReturnRef = useFocusReturn();
	const overlayRef = useMergeRefs( [ focusOnMountRef, focusReturnRef ] );

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

	const handleKeyDown = ( event ) => {
		if ( event.key === 'Escape' ) {
			event.stopPropagation();
			handleCancel();
		}
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
		/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions */
		<div
			className="wp-block-image__upload-overlay"
			ref={ overlayRef }
			role="group"
			aria-label={ __( 'Upload progress' ) }
			tabIndex="-1"
			onKeyDown={ handleKeyDown }
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
				aria-label={
					filename
						? sprintf(
								/* translators: %s: filename of the image being uploaded */
								__( 'Cancel upload of %s' ),
								filename
						  )
						: __( 'Cancel upload' )
				}
			>
				{ __( 'Cancel' ) }
			</Button>
		</div>
	);
}
