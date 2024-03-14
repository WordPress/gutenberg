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

export function usePostActions( hasEdit ) {
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

		const actionsToReturn = [
			customizedTrashPostAction,
			customizedPermanentlyDeletePostAction,
			restorePostAction,
			viewPostAction,
			postRevisionsAction,
		];

		if ( hasEdit ) {
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
			actionsToReturn.push( customizedEditPostAction );
		}

		return actionsToReturn;
	}, [
		permanentlyDeletePostAction,
		editPostAction,
		restorePostAction,
		history,
		hasEdit,
	] );
	return actions;
}

export default function PostActions( { postType, postId, hasEdit = true } ) {
	const actions = usePostActions( hasEdit );

	return (
		<EditorPostActions
			postType={ postType }
			postId={ postId }
			actions={ actions }
		/>
	);
}
