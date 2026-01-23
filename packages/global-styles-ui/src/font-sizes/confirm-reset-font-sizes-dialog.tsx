/**
 * WordPress dependencies
 */
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface ConfirmResetFontSizesDialogProps {
	text: string;
	confirmButtonText: string;
	isOpen: boolean;
	toggleOpen: () => void;
	onConfirm: () => void;
}

function ConfirmResetFontSizesDialog( {
	text,
	confirmButtonText,
	isOpen,
	toggleOpen,
	onConfirm,
}: ConfirmResetFontSizesDialogProps ) {
	const handleConfirm = async () => {
		toggleOpen();
		onConfirm();
	};

	const handleCancel = () => {
		toggleOpen();
	};

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

export default ConfirmResetFontSizesDialog;
