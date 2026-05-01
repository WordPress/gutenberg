/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';

type ConfirmOfflineEditViewProps = {
	isPublished: boolean;
	onCancel: () => void;
	onConfirm: () => void;
};

// Body of the sync connection error modal when the user has chosen Edit
// Anyway. Warns about data-loss risk (with an extra note for published
// posts where we can't safely merge concurrent server-side changes) and
// asks the user to confirm.
export default function ConfirmOfflineEditView( {
	isPublished,
	onCancel,
	onConfirm,
}: ConfirmOfflineEditViewProps ) {
	const warning = isPublished
		? __(
				'Your edits will be saved locally and synced when the connection returns. Because this post is published, saving while disconnected may overwrite changes made by other editors in the meantime.'
		  )
		: __(
				'Your edits will be saved locally and synced when the connection returns. If you close this tab before reconnecting, unsaved changes may be lost.'
		  );

	return (
		<>
			<p>{ warning }</p>
			<Stack justify="flex-end" gap="sm">
				<Button
					__next40pxDefaultSize
					variant="tertiary"
					onClick={ onCancel }
				>
					{ __( 'Cancel' ) }
				</Button>
				<Button
					__next40pxDefaultSize
					isDestructive
					variant="primary"
					onClick={ onConfirm }
				>
					{ __( 'Edit Anyway' ) }
				</Button>
			</Stack>
		</>
	);
}
