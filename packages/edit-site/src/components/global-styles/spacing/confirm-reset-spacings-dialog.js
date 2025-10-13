/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function ConfirmResetSpacingsDialog( {
	text,
	confirmButtonText,
	isOpen,
	toggleOpen,
	onConfirm,
} ) {
	const handleConfirm = () => {
		onConfirm();
		toggleOpen();
	};

	const handleCancel = () => {
		toggleOpen();
	};

	if ( ! isOpen ) {
		return null;
	}

	return (
		<ConfirmDialog
			isOpen={ isOpen }
			cancelButtonText={ __( 'Cancel' ) }
			confirmButtonText={ confirmButtonText }
			onCancel={ handleCancel }
			onConfirm={ handleConfirm }
			size="medium"
		>
			{ text }
		</ConfirmDialog>
	);
}

export default ConfirmResetSpacingsDialog;
