/**
 * WordPress dependencies
 */
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose, useViewportMatch } from '@wordpress/compose';
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
	const isMobileViewport = useViewportMatch( 'small', '<' );
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
		<>
			<Button
				className="editor-post-switch-to-draft"
				onClick={ () => {
					setShowConfirmDialog( true );
				} }
				disabled={ isSaving }
				variant="tertiary"
			>
				{ isMobileViewport ? __( 'Draft' ) : __( 'Switch to draft' ) }
			</Button>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ handleConfirm }
				onCancel={ () => setShowConfirmDialog( false ) }
			>
				{ alertMessage }
			</ConfirmDialog>
		</>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const {
			isSavingPost,
			isCurrentPostPublished,
			isCurrentPostScheduled,
		} = select( editorStore );
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
