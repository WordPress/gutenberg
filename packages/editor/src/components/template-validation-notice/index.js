/**
 * WordPress dependencies
 */
import {
	Notice,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

export default function TemplateValidationNotice() {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
	const isValid = useSelect( ( select ) => {
		return select( blockEditorStore ).isValidTemplate();
	}, [] );
	const { setTemplateValidity, synchronizeTemplate } =
		useDispatch( blockEditorStore );

	if ( isValid ) {
		return null;
	}

	return (
		<>
			<Notice
				className="editor-template-validation-notice"
				isDismissible={ false }
				status="warning"
				actions={ [
					{
						label: __( 'Keep it as is' ),
						onClick: () => setTemplateValidity( true ),
					},
					{
						label: __( 'Reset the template' ),
						onClick: () => setShowConfirmDialog( true ),
					},
				] }
			>
				{ __(
					'The content of your post doesn’t match the template assigned to your post type.'
				) }
			</Notice>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				confirmButtonText={ __( 'Reset' ) }
				onConfirm={ () => {
					setShowConfirmDialog( false );
					synchronizeTemplate();
				} }
				onCancel={ () => setShowConfirmDialog( false ) }
				size="medium"
			>
				{ __(
					'Resetting the template may result in loss of content, do you want to continue?'
				) }
			</ConfirmDialog>
		</>
	);
}
