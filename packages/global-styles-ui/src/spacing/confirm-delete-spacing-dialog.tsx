/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import type { SpacingSize } from '@wordpress/global-styles-engine';

interface ConfirmDeleteSpacingDialogProps {
	spacingSize: SpacingSize;
	isOpen: boolean;
	toggleOpen: () => void;
	handleRemoveSpacingSize: ( spacingSize: SpacingSize ) => void;
}

function ConfirmDeleteSpacingDialog( {
	spacingSize,
	isOpen,
	toggleOpen,
	handleRemoveSpacingSize,
}: ConfirmDeleteSpacingDialogProps ) {
	const handleConfirm = () => {
		handleRemoveSpacingSize( spacingSize );
		toggleOpen();
	};

	const handleCancel = () => {
		toggleOpen();
	};

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			cancelButtonText={ __( 'Cancel' ) }
			confirmButtonText={ __( 'Delete' ) }
			onCancel={ handleCancel }
			onConfirm={ handleConfirm }
			size="medium"
		>
			{ spacingSize &&
				sprintf(
					/* translators: %s: Name of the spacing size preset. */
					__(
						'Are you sure you want to delete "%s" spacing size preset?'
					),
					spacingSize.name
				) }
		</ConfirmDialog>
	);
}

export default ConfirmDeleteSpacingDialog;
