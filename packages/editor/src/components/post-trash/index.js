/**
 * WordPress dependencies
 */
import { Button } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { usePostActions } from '../post-actions/actions';
import PostTrashCheck from './check';
import { ActionWithModal } from '../post-actions';

function TrashActionTriggerButton( { action, onClick, items } ) {
	const { isDeleting } = useSelect( ( select ) => {
		const store = select( editorStore );
		return {
			isDeleting: store.isDeletingPost(),
		};
	}, [] );
	const label =
		typeof action.label === 'string' ? action.label : action.label( items );
	return (
		<Button
			__next40pxDefaultSize
			className="editor-post-trash"
			isDestructive
			variant="secondary"
			isBusy={ isDeleting }
			aria-disabled={ isDeleting }
			onClick={ onClick }
		>
			{ label }
		</Button>
	);
}

/**
 * Displays the Post Trash Button and Confirm Dialog in the Editor.
 *
 * @param {{onActionPerformed: Object}} Object containing the onActionPerformed actions to execute.
 * @return {JSX.Element|null} The rendered PostTrash component.
 */
function PostTrashButton( { onActionPerformed } ) {
	const { postType, item } = useSelect( ( select ) => {
		const store = select( editorStore );
		const { getEditedEntityRecord } = select( coreStore );
		const postId = store.getCurrentPostId();
		const _postType = store.getCurrentPostType();
		return {
			postType: _postType,
			item: getEditedEntityRecord( 'postType', _postType, postId ),
		};
	}, [] );
	const actions = usePostActions( { postType, onActionPerformed } );
	const trashPostAction = actions.find(
		( action ) => action.id === 'move-to-trash'
	);
	if ( ! trashPostAction ) {
		return null;
	}
	return (
		<ActionWithModal
			action={ trashPostAction }
			item={ item }
			ActionTrigger={ TrashActionTriggerButton }
		/>
	);
}

/**
 * Displays the Post Trash Button and Confirm Dialog in the Editor,
 * checking for the eligibility of the action.
 *
 * @param {{onActionPerformed: Object}} Object containing the onActionPerformed actions to execute.
 * @return {JSX.Element|null} The rendered PostTrash component.
 */
export default function PostTrash( { onActionPerformed } ) {
	return (
		<PostTrashCheck>
			<PostTrashButton onActionPerformed={ onActionPerformed } />
		</PostTrashCheck>
	);
}
