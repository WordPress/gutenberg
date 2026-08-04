/**
 * WordPress dependencies
 */
import { Button, Notice } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { copySmall } from '@wordpress/icons';
import { store as noticesStore } from '@wordpress/notices';

type UploadErrorNoticeProps = {
	/** The error message to display. */
	message: string;
	/** Called when the user dismisses the notice. */
	onRemove: () => void;
};

/**
 * A dismissible error notice rendered inside the Image block placeholder.
 *
 * Upload errors used to be shown in a snackbar, which vanished before the
 * message could be read. Rendering the error in the block keeps it in place
 * next to the image that failed, and the copy button makes it easy to paste
 * the message into a search or a support request.
 *
 * @param props
 * @param props.message  The error message to display.
 * @param props.onRemove Called when the user dismisses the notice.
 */
export default function UploadErrorNotice( {
	message,
	onRemove,
}: UploadErrorNoticeProps ) {
	const { createSuccessNotice } = useDispatch( noticesStore );
	const copyRef = useCopyToClipboard< HTMLButtonElement >( message, () => {
		createSuccessNotice( __( 'Error message copied to clipboard.' ), {
			type: 'snackbar',
		} );
	} );

	return (
		<Notice
			className="wp-block-image__upload-error-notice"
			status="error"
			onRemove={ onRemove }
			politeness="assertive"
		>
			<p>{ message }</p>
			<Button
				ref={ copyRef }
				className="wp-block-image__upload-error-copy"
				icon={ copySmall }
				size="compact"
				variant="secondary"
				text={ __( 'Copy error message' ) }
			/>
		</Notice>
	);
}
