import { Modal, Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

type InsertExternalImageModalProps = {
	/**
	 * Called to dismiss without inserting.
	 */
	onClose: () => void;
	/**
	 * Called to insert the external image.
	 */
	onSubmit: () => void;
};

/**
 * Asks the user to confirm inserting an external image as-is when it can't be
 * uploaded to the Media Library (no upload permission, or the host blocks the
 * fetch).
 */
export default function InsertExternalImageModal( {
	onClose,
	onSubmit,
}: InsertExternalImageModalProps ) {
	return (
		<Modal
			title={ __( 'Insert external image' ) }
			onRequestClose={ onClose }
			className="block-editor-inserter-media-tab-media-preview-inserter-external-image-modal"
		>
			<Stack direction="column" gap="md">
				<p>
					{ __(
						'This image cannot be uploaded to your Media Library, but it can still be inserted as an external image.'
					) }
				</p>
				<p>
					{ __(
						'External images can be removed by the external provider without warning and could even have legal compliance issues related to privacy legislation.'
					) }
				</p>
			</Stack>
			<Stack
				direction="row"
				justify="flex-end"
				gap="sm"
				className="block-editor-block-lock-modal__actions"
			>
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onClose }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					variant="primary"
					onClick={ onSubmit }
				>
					{ __( 'Insert' ) }
				</Button>
			</Stack>
		</Modal>
	);
}
