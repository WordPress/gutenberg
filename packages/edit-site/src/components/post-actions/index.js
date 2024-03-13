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
	postRevisionsAction,
} = postManagementActions;

export default function PostActions( { postType, postId } ) {
	const history = useHistory();

	const permanentlyDeletePostAction = usePermanentlyDeletePostAction();
	const restorePostAction = useRestorePostAction();

	const actions = useMemo( () => {
		const TrashPostModal = trashPostAction.RenderModal;
		const customizedTrashPostAction = {
			...trashPostAction,
			RenderModal: ( props ) => {
				return (
					<TrashPostModal
						{ ...props }
						onPerform={ () => {
							if ( props.onPerform ) {
								props.onPerform();
							}
							history.push( {
								path: '/' + postType,
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
						path: '/' + postType,
						postId: undefined,
						postType: undefined,
						canvas: 'view',
					} );
				} );
			},
		};
		return [
			customizedTrashPostAction,
			customizedPermanentlyDeletePostAction,
			restorePostAction,
			postRevisionsAction,
		];
	}, [ permanentlyDeletePostAction, restorePostAction, history, postType ] );

	return (
		<EditorPostActions
			postType={ postType }
			postId={ postId }
			actions={ actions }
		/>
	);
}
