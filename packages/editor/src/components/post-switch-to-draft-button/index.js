/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

// TODO: deprecate..
export default function PostSwitchToDraftButton() {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	const { editPost, savePost } = useDispatch( editorStore );
	const { isSaving, isPublished, isScheduled } = useSelect( ( select ) => {
		const { isSavingPost, isCurrentPostPublished, isCurrentPostScheduled } =
			select( editorStore );
		return {
			isSaving: isSavingPost(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
		};
	}, [] );

	const isDisabled = isSaving || ( ! isPublished && ! isScheduled );

	let alertMessage;
	let confirmButtonText;
	if ( isPublished ) {
		alertMessage = __( 'Are you sure you want to unpublish this post?' );
		confirmButtonText = __( 'Unpublish' );
	} else if ( isScheduled ) {
		alertMessage = __( 'Are you sure you want to unschedule this post?' );
		confirmButtonText = __( 'Unschedule' );
	}

	const handleConfirm = () => {
		setShowConfirmDialog( false );
		editPost( { status: 'draft' } );
		savePost();
	};

	return (
		<>
			<Button
				__next40pxDefaultSize
				className="editor-post-switch-to-draft"
				onClick={ () => {
					if ( ! isDisabled ) {
						setShowConfirmDialog( true );
					}
				} }
				aria-disabled={ isDisabled }
				variant="secondary"
				style={ { flexGrow: '1', justifyContent: 'center' } }
			>
				{ __( 'Switch to draft' ) }
			</Button>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ handleConfirm }
				onCancel={ () => setShowConfirmDialog( false ) }
				confirmButtonText={ confirmButtonText }
			>
				{ alertMessage }
			</ConfirmDialog>
		</>
	);
}
