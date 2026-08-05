/**
 * WordPress dependencies
 */
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

interface ConfirmDeleteDialogProps {
	message: string;
	isOpen: boolean;
	toggleOpen: () => void;
	onConfirm: () => void;
}

export default function ConfirmDeleteDialog( {
	message,
	isOpen,
	toggleOpen,
	onConfirm,
}: ConfirmDeleteDialogProps ) {
	return (
		<ConfirmDialog
			isOpen={ isOpen }
			cancelButtonText={ __( 'Cancel' ) }
			confirmButtonText={ __( 'Delete' ) }
			onCancel={ toggleOpen }
			onConfirm={ () => {
				toggleOpen();
				onConfirm();
			} }
			size="medium"
		>
			{ message }
		</ConfirmDialog>
	);
}
