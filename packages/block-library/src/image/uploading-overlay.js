/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { ProgressBar } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { store as uploadMediaStore } from '@wordpress/upload-media';

/**
 * Internal dependencies
 */
import { unlock } from '../lock-unlock';

/**
 * Component that displays upload progress overlay on the image block.
 *
 * @param {Object} props              Component props.
 * @param {string} props.url          The blob URL of the uploading image.
 * @param {number} props.attachmentId The attachment ID, used as fallback when url is not available.
 */
export default function UploadingOverlay( { url, attachmentId } ) {
	const progress = useSelect(
		( select ) => {
			const { getItemByBlobUrl, getItemByAttachmentId } = unlock(
				select( uploadMediaStore )
			);
			const item =
				( url && getItemByBlobUrl( url ) ) ||
				( attachmentId && getItemByAttachmentId( attachmentId ) ) ||
				undefined;

			return item?.progress;
		},
		[ url, attachmentId ]
	);

	// Convert progress from 0-100 to percentage for display.
	const progressValue =
		typeof progress === 'number' ? Math.round( progress ) : undefined;

	return (
		<div
			className="wp-block-image__upload-overlay"
			role="progressbar"
			aria-label={ __( 'Upload progress' ) }
			aria-valuenow={ progressValue }
			aria-valuemin={ 0 }
			aria-valuemax={ 100 }
		>
			<ProgressBar value={ progressValue } />
		</div>
	);
}
