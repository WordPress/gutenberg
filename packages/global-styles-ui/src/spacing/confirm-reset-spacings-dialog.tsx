/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

interface ConfirmResetSpacingsDialogProps {
	text: string;
	confirmButtonText: string;
	isOpen: boolean;
	toggleOpen: () => void;
	onConfirm: () => void;
}

function ConfirmResetSpacingsDialog( {
	text,
	confirmButtonText,
	isOpen,
	toggleOpen,
	onConfirm,
}: ConfirmResetSpacingsDialogProps ) {
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
