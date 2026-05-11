/**
 * WordPress dependencies
 */
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface ConfirmResetShadowDialogProps {
	text: string;
	confirmButtonText: string;
	isOpen: boolean;
	toggleOpen: () => void;
	onConfirm: () => void;
}

function ConfirmResetShadowDialog( {
	text,
	confirmButtonText,
	isOpen,
	toggleOpen,
	onConfirm,
}: ConfirmResetShadowDialogProps ) {
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

export default ConfirmResetShadowDialog;
