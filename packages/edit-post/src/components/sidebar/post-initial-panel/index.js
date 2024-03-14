/**
 * WordPress dependencies
 */
import {
	PanelBody,
	__experimentalText as Text,
	__experimentalVStack as VStack,
} from '@wordpress/components';
import {
	store as editorStore,
	privateApis as editorPrivateApis,
} from '@wordpress/editor';
import { decodeEntities } from '@wordpress/html-entities';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import { page as pageIcon } from '@wordpress/icons';
import { __, sprintf } from '@wordpress/i18n';
import { humanTimeDiff } from '@wordpress/date';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { unlock } from '../../../lock-unlock';

const {
	PostActions: EditorPostActions,
	postManagementActions,
	PostSidebarCard,
} = unlock( editorPrivateApis );

const {
	trashPostAction,
	usePermanentlyDeletePostAction,
	useRestorePostAction,
	postRevisionsAction,
} = postManagementActions;

function PostActions( { postType, postId } ) {
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
							window.location.href = addQueryArgs( 'edit.php', {
								post_type: postType,
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
					window.location.href = addQueryArgs( 'edit.php', {
						post_type: postType,
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
	}, [ permanentlyDeletePostAction, restorePostAction, postType ] );

	return (
		<EditorPostActions
			postType={ postType }
			postId={ postId }
			actions={ actions }
		/>
	);
}

export default function PostInitialSidebar() {
	const { postType, postId, modified, title } = useSelect( ( select ) => {
		const { getCurrentPostType, getCurrentPostId, getEditedPostAttribute } =
			select( editorStore );
		return {
			postType: getCurrentPostType(),
			postId: getCurrentPostId(),
			title: getEditedPostAttribute( 'title' ),
			modified: getEditedPostAttribute( 'modified' ),
		};
	} );
	return (
		<PanelBody>
			<PostSidebarCard
				title={ decodeEntities( title ) }
				icon={ pageIcon }
				actions={
					<PostActions postType={ postType } postId={ postId } />
				}
				description={
					<VStack>
						<Text>
							{ sprintf(
								// translators: %s: Human-readable time difference, e.g. "2 days ago".
								__( 'Last edited %s' ),
								humanTimeDiff( modified )
							) }
						</Text>
					</VStack>
				}
			/>
		</PanelBody>
	);
}
