/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function ConfirmDeleteSpacingDialog( {
	spacingSize,
	isOpen,
	toggleOpen,
	handleRemoveSpacingSize,
} ) {
	const handleConfirm = () => {
		handleRemoveSpacingSize();
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
