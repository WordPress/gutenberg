/**
 * WordPress dependencies
 */
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';

interface ConfirmApplyFontToAllDialogProps {
	fontName: string;
	elementCount: number;
	isOpen: boolean;
	toggleOpen: () => void;
	onConfirm: () => void;
}

function ConfirmApplyFontToAllDialog( {
	fontName,
	elementCount,
	isOpen,
	toggleOpen,
	onConfirm,
}: ConfirmApplyFontToAllDialogProps ) {
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
			confirmButtonText={ __( 'Apply to All' ) }
			onCancel={ handleCancel }
			onConfirm={ handleConfirm }
			size="medium"
		>
			{ sprintf(
				/* translators: 1: Font name, 2: Number of elements */
				__(
					'Apply "%1$s" to all %2$d typography elements? This will replace any custom fonts set on headings, links, buttons, and captions.'
				),
				fontName,
				elementCount
			) }
		</ConfirmDialog>
	);
}

export default ConfirmApplyFontToAllDialog;
