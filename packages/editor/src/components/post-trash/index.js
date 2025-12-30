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
import { store as coreDataStore } from '@wordpress/core-data';

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
	const { isNew, isTrashDisabled, isDeleting, postId, title } = useSelect(
		( select ) => {
			const store = select( editorStore );
			const coreStore = select( coreDataStore );
			const currentPostType = store.getCurrentPostType();

			// Get Post Type entity to check supports
			const postTypeEntity = coreStore.getPostType( currentPostType );

			// Check if 'trash' is supported. Default to true if undefined.
			const supportsTrash = postTypeEntity?.supports?.trash ?? true;

			return {
				isNew: store.isEditedPostNew(),
				isTrashDisabled: ! supportsTrash,
				isDeleting: store.isDeletingPost(),
				postId: store.getCurrentPostId(),
				title: store.getCurrentPostAttribute( 'title' ),
			};
		},
		[]
	);
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

	const buttonLabel = isTrashDisabled
		? __( 'Delete permanently' )
		: __( 'Move to trash' );

	const confirmMessage = isTrashDisabled
		? sprintf(
				/* translators: %s: The item's title. */
				__( 'Are you sure you want to delete "%s" permanently?' ),
				title
		  )
		: sprintf(
				/* translators: %s: The item's title. */
				__( 'Are you sure you want to move "%s" to the trash?' ),
				title
		  );

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
				{ buttonLabel }
			</Button>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ handleConfirm }
				onCancel={ () => setShowConfirmDialog( false ) }
				confirmButtonText={ buttonLabel }
				size="small"
			>
				{ confirmMessage }
			</ConfirmDialog>
		</PostTrashCheck>
	);
}
