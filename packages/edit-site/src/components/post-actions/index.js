/**
 * WordPress dependencies
 */
import { privateApis as editorPrivateApis } from '@wordpress/editor';
import { privateApis as routerPrivateApis } from '@wordpress/router';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';

const { useHistory } = unlock( routerPrivateApis );

const { PostActions: EditorPostActions, postManagementActions } =
	unlock( editorPrivateApis );
const {
	trashPostAction,
	usePermanentlyDeletePostAction,
	useRestorePostAction,
	viewPostAction,
	useEditPostAction,
	postRevisionsAction,
} = postManagementActions;

export function usePostActions() {
	const history = useHistory();

	const permanentlyDeletePostAction = usePermanentlyDeletePostAction();
	const restorePostAction = useRestorePostAction();
	const editPostAction = useEditPostAction();

	const actions = useMemo( () => {
		const TrashPostModal = trashPostAction.RenderModal;
		const customizedTrashPostAction = {
			...trashPostAction,
			RenderModal: ( props ) => {
				return (
					<TrashPostModal
						{ ...props }
						onPerform={ ( items ) => {
							if ( props.onPerform ) {
								props.onPerform();
							}
							history.push( {
								path: '/' + items[ 0 ].type,
								postId: undefined,
								postType: undefined,
								canvas: 'view',
							} );
						} }
					/>
				);
			},
		};
		const customizedPermanentlyDeletePostAction = {
			...permanentlyDeletePostAction,
			callback: async ( posts, onPerform ) => {
				await permanentlyDeletePostAction.callback( posts, () => {
					if ( onPerform ) {
						onPerform();
					}
					history.push( {
						path: '/' + posts[ 0 ].type,
						postId: posts[ 0 ].id,
						postType: posts[ 0 ].type,
						canvas: 'view',
					} );
				} );
			},
		};

		const customizedEditPostAction = {
			...editPostAction,
			callback: ( posts ) => {
				const post = posts[ 0 ];
				history.push( {
					postId: post.id,
					postType: post.type,
					canvas: 'edit',
				} );
			},
		};

		return [
			customizedTrashPostAction,
			customizedPermanentlyDeletePostAction,
			restorePostAction,
			viewPostAction,
			customizedEditPostAction,
			postRevisionsAction,
		];
	}, [
		permanentlyDeletePostAction,
		editPostAction,
		restorePostAction,
		history,
	] );
	return actions;
}

export default function PostActions( { postType, postId } ) {
	const actions = usePostActions();

	return (
		<EditorPostActions
			postType={ postType }
			postId={ postId }
			actions={ actions }
		/>
	);
}
