/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import PostTrashCheck from './check';

/**
 * Displays the Post Trash Button and Confirm Dialog in the Editor.
 *
 * @param {?{onActionPerformed: Object}} An object containing the onActionPerformed function.
 * @return {React.ReactNode} The rendered PostTrash component.
 */
export default function PostTrash( { onActionPerformed } ) {
	const registry = useRegistry();
	const { isNew, isDeleting, postId, title } = useSelect( ( select ) => {
		const store = select( editorStore );
		return {
			isNew: store.isEditedPostNew(),
			isDeleting: store.isDeletingPost(),
			postId: store.getCurrentPostId(),
			title: store.getCurrentPostAttribute( 'title' ),
		};
	}, [] );
	const { trashPost } = useDispatch( editorStore );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );

	if ( isNew || ! postId ) {
		return null;
	}

	const handleConfirm = async () => {
		setShowConfirmDialog( false );
		await trashPost();
		const item = await registry
			.resolveSelect( editorStore )
			.getCurrentPost();
		// After the post is trashed, we want to trigger the onActionPerformed callback, so the user is redirect
		// to the post view depending on if the user is on post editor or site editor.
		onActionPerformed?.( 'move-to-trash', [ item ] );
	};
	return (
		<PostTrashCheck>
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
				size="small"
			>
				{ sprintf(
					// translators: %s: The item's title.
					__( 'Are you sure you want to move "%s" to the trash?' ),
					title
				) }
			</ConfirmDialog>
		</PostTrashCheck>
	);
}
