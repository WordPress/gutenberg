/**
 * WordPress dependencies
 */
import {
	Button,
	FlexItem,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostSwitchToDraftButton( {
	isSaving,
	isPublished,
	isScheduled,
	onClick,
} ) {
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	if ( ! isPublished && ! isScheduled ) {
		return null;
	}

	let alertMessage;
	if ( isPublished ) {
		alertMessage = __( 'Are you sure you want to unpublish this post?' );
	} else if ( isScheduled ) {
		alertMessage = __( 'Are you sure you want to unschedule this post?' );
	}

	const handleConfirm = () => {
		setShowConfirmDialog( false );
		onClick();
	};

	return (
		<FlexItem isBlock>
			<Button
				className="editor-post-switch-to-draft"
				onClick={ () => {
					setShowConfirmDialog( true );
				} }
				disabled={ isSaving }
				variant="secondary"
				style={ { width: '100%', display: 'block' } }
			>
				{ __( 'Switch to draft' ) }
			</Button>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ handleConfirm }
				onCancel={ () => setShowConfirmDialog( false ) }
			>
				{ alertMessage }
			</ConfirmDialog>
		</FlexItem>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { isSavingPost, isCurrentPostPublished, isCurrentPostScheduled } =
			select( editorStore );
		return {
			isSaving: isSavingPost(),
			isPublished: isCurrentPostPublished(),
			isScheduled: isCurrentPostScheduled(),
		};
	} ),
	withDispatch( ( dispatch ) => {
		const { editPost, savePost } = dispatch( editorStore );
		return {
			onClick: () => {
				editPost( { status: 'draft' } );
				savePost();
			},
		};
	} ),
] )( PostSwitchToDraftButton );
