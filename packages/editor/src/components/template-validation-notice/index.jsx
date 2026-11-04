import { speak } from '@wordpress/a11y';
import { __experimentalConfirmDialog as ConfirmDialog } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { Notice } from '@wordpress/ui';

export default function TemplateValidationNotice() {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
	const isValid = useSelect( ( select ) => {
		return select( blockEditorStore ).isValidTemplate();
	}, [] );
	const { setTemplateValidity, synchronizeTemplate } =
		useDispatch( blockEditorStore );
	const message = __(
		'The content of your post doesn’t match the template assigned to your post type.'
	);

	// `Notice.Root` does not announce itself, so announce the notice when
	// the template becomes invalid.
	useEffect( () => {
		if ( ! isValid ) {
			speak( message );
		}
	}, [ isValid, message ] );

	if ( isValid ) {
		return null;
	}

	return (
		<>
			<Notice.Root
				className="editor-template-validation-notice"
				intent="warning"
			>
				<Notice.Description>{ message }</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton
						variant="outline"
						onClick={ () => setTemplateValidity( true ) }
					>
						{ __( 'Keep it as is' ) }
					</Notice.ActionButton>
					<Notice.ActionButton
						variant="outline"
						onClick={ () => setShowConfirmDialog( true ) }
					>
						{ __( 'Reset the template' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
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
