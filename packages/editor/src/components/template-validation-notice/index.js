/**
 * WordPress dependencies
 */
import {
	Notice,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';

function TemplateValidationNotice( { isValid, ...props } ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

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
						onClick: props.resetTemplateValidity,
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
				onConfirm={ () => {
					setShowConfirmDialog( false );
					props.synchronizeTemplate();
				} }
				onCancel={ () => setShowConfirmDialog( false ) }
			>
				{ __(
					'Resetting the template may result in loss of content, do you want to continue?'
				) }
			</ConfirmDialog>
		</>
	);
}

export default compose( [
	withSelect( ( select ) => ( {
		isValid: select( blockEditorStore ).isValidTemplate(),
	} ) ),
	withDispatch( ( dispatch ) => {
		const { setTemplateValidity, synchronizeTemplate } =
			dispatch( blockEditorStore );
		return {
			resetTemplateValidity: () => setTemplateValidity( true ),
			synchronizeTemplate,
		};
	} ),
] )( TemplateValidationNotice );
