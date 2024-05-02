/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

export default function PostTrash() {
	const { isNew, isDeleting, postId } = useSelect( ( select ) => {
		const store = select( editorStore );
		return {
			isNew: store.isEditedPostNew(),
			isDeleting: store.isDeletingPost(),
			postId: store.getCurrentPostId(),
		};
	}, [] );
	const { trashPost } = useDispatch( editorStore );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	if ( isNew || ! postId ) {
		return null;
	}

	const handleConfirm = () => {
		setShowConfirmDialog( false );
		trashPost();
	};

	return (
		<>
			<Button
				__next40pxDefaultSize
				className="editor-post-trash"
				isDestructive
				variant="secondary"
				isBusy={ isDeleting }
				aria-disabled={ isDeleting }
				onClick={
					isDeleting ? undefined : () => setShowConfirmDialog( true )
				}
			>
				{ __( 'Move to trash' ) }
			</Button>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ handleConfirm }
				onCancel={ () => setShowConfirmDialog( false ) }
				confirmButtonText={ __( 'Move to trash' ) }
			>
				{ __(
					'Are you sure you want to move this post to the trash?'
				) }
			</ConfirmDialog>
		</>
	);
}
