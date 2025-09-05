/**
 * WordPress dependencies
 */
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

function ConfirmResetShadowDialog( {
	text,
	confirmButtonText,
	isOpen,
	toggleOpen,
	onConfirm,
} ) {
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
