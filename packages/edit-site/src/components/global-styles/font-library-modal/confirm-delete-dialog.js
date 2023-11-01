/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';

function ConfirmDeleteDialog( {
	font,
	isConfirmDeleteOpen,
	handleConfirmUninstall,
	handleCancelUninstall,
} ) {
	return (
		<ConfirmDialog
			isOpen={ isConfirmDeleteOpen }
			cancelButtonText={ __( 'No, keep the font' ) }
			confirmButtonText={ __( 'Yes, uninstall' ) }
			onCancel={ handleCancelUninstall }
			onConfirm={ handleConfirmUninstall }
		>
			{ font &&
				sprintf(
					/* translators: %s: Name of the font. */
					__(
						'Would you like to remove %s and all its variants and assets?'
					),
					font.name
				) }
		</ConfirmDialog>
	);
}

export default ConfirmDeleteDialog;
