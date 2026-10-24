import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	__experimentalConfirmDialog as ConfirmDialog,
} from '@wordpress/components';
import { useSelect, useDispatch, useRegistry } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { store as editorStore } from '../../store';
import { getSuggestTrashRefusalMessage } from '../../store/suggest-post-edit-guard';
import { useIsPostSettingLocked } from '../suggestion-mode/use-locked-post-field';
import PostTrashCheck from './check';

/**
 * Displays the Post Trash Button and Confirm Dialog in the Editor.
 *
 * @param {?{onActionPerformed: Object}} An object containing the onActionPerformed function.
 * @return {React.ReactNode} The rendered PostTrash component.
 */
export default function PostTrash( { onActionPerformed } ) {
	const registry = useRegistry();
	const { isNew, isDeleting, postId, title, canMoveToTrash } = useSelect(
		( select ) => {
			const store = select( editorStore );
			return {
				isNew: store.isEditedPostNew(),
				isDeleting: store.isDeletingPost(),
				postId: store.getCurrentPostId(),
				title: store.getCurrentPostAttribute( 'title' ),
				canMoveToTrash:
					!! store.getCurrentPost()._links?.[ 'wp:action-trash' ],
			};
		},
		[]
	);
	const { trashPost } = useDispatch( editorStore );
	const [ showConfirmDialog, setShowConfirmDialog ] = useState( false );
	// Trashing is not something a suggestion can propose.
	const isLocked = useIsPostSettingLocked();

	if ( isNew || ! postId ) {
		return null;
	}

	const handleConfirm = async () => {
		setShowConfirmDialog( false );
		await trashPost( { force: ! canMoveToTrash } );
		const item = await registry
			.resolveSelect( editorStore )
			.getCurrentPost();
		// After the post is trashed, we want to trigger the onActionPerformed callback, so the user is redirect
		// to the post view depending on if the user is on post editor or site editor.
		onActionPerformed?.(
			canMoveToTrash ? 'move-to-trash' : 'permanently-delete',
			[ item ]
		);
	};
	const label = canMoveToTrash
		? __( 'Move to trash' )
		: __( 'Delete permanently' );
	const message = canMoveToTrash
		? // translators: %s: The item's title.
			__( 'Are you sure you want to move "%s" to the trash?' )
		: // translators: %s: The item's title.
			__( 'Are you sure you want to permanently delete "%s"?' );
	return (
		<PostTrashCheck>
			<Button
				__next40pxDefaultSize
				className="editor-post-trash"
				isDestructive
				variant="secondary"
				isBusy={ isDeleting }
				aria-disabled={ isDeleting || isLocked }
				disabled={ isLocked }
				accessibleWhenDisabled
				description={
					isLocked ? getSuggestTrashRefusalMessage() : undefined
				}
				onClick={
					isDeleting || isLocked
						? undefined
						: () => setShowConfirmDialog( true )
				}
			>
				{ label }
			</Button>
			<ConfirmDialog
				isOpen={ showConfirmDialog }
				onConfirm={ handleConfirm }
				onCancel={ () => setShowConfirmDialog( false ) }
				confirmButtonText={ label }
				size="small"
			>
				{ sprintf( message, title ) }
			</ConfirmDialog>
		</PostTrashCheck>
	);
}
