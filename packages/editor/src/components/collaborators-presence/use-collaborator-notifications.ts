/**
 * WordPress dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { store as noticesStore } from '@wordpress/notices';
import {
	privateApis,
	type PostEditorAwarenessState,
	type PostSaveEvent,
} from '@wordpress/core-data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { unlock } from '../../lock-unlock';
import { store as editorStore } from '../../store';

const { useOnCollaboratorJoin, useOnCollaboratorLeave, useOnPostSave } =
	unlock( privateApis );

/**
 * Notice IDs for each notification type. Using stable IDs prevents duplicate
 * notices if the same event is processed more than once.
 */
const NOTIFICATION_TYPE = {
	COLLAB_POST_UPDATED: 'collab-post-updated',
	COLLAB_USER_ENTERED: 'collab-user-entered',
	COLLAB_USER_EXITED: 'collab-user-exited',
} as const;

const PUBLISHED_STATUSES = [ 'publish', 'private', 'future' ];

/**
 * Returns the snackbar message for a post updated notification.
 *
 * @param name           Display name of the collaborator who saved.
 * @param status         WordPress post status at the time of save.
 * @param isFirstPublish Whether this save transitioned the post to published.
 */
function getPostUpdatedMessage(
	name: string,
	status: string,
	isFirstPublish: boolean
): string {
	if ( isFirstPublish ) {
		/* translators: %s: collaborator display name */
		return sprintf( __( 'Post published by %s.' ), name );
	}
	if ( PUBLISHED_STATUSES.includes( status ) ) {
		/* translators: %s: collaborator display name */
		return sprintf( __( 'Post updated by %s.' ), name );
	}
	/* translators: %s: collaborator display name */
	return sprintf( __( 'Draft saved by %s.' ), name );
}

/**
 * Hook that watches for collaborator join/leave events and remote save events,
 * dispatching snackbar notices accordingly.
 *
 * @param postId   The ID of the post being edited.
 * @param postType The post type of the post being edited.
 */
export function useCollaboratorNotifications(
	postId: number | null,
	postType: string | null
): void {
	const { postStatus, isCollaborationEnabled, showNotifications } = useSelect(
		( select ) => {
			const editorSel = select( editorStore );
			return {
				postStatus: editorSel.getCurrentPostAttribute( 'status' ) as
					| string
					| undefined,
				isCollaborationEnabled:
					editorSel.isCollaborationEnabledForCurrentPost(),
				showNotifications:
					select( preferencesStore ).get(
						'core',
						'showCollaborationNotifications'
					) ?? true,
			};
		},
		[]
	);

	const { createNotice } = useDispatch( noticesStore );

	// Pass null when collaboration is disabled or notifications are
	// turned off to prevent the hooks from subscribing to awareness state.
	const shouldSubscribe = isCollaborationEnabled && showNotifications;
	const effectivePostId = shouldSubscribe ? postId : null;
	const effectivePostType = shouldSubscribe ? postType : null;

	useOnCollaboratorJoin(
		effectivePostId,
		effectivePostType,
		useCallback(
			(
				collaborator: PostEditorAwarenessState,
				me?: PostEditorAwarenessState
			) => {
				/*
				 * Skip collaborators who were present before the current user
				 * joined. Their enteredAt is earlier than ours, meaning we're
				 * the newcomer.
				 */
				if (
					me &&
					collaborator.collaboratorInfo.enteredAt <
						me.collaboratorInfo.enteredAt
				) {
					return;
				}

				void createNotice(
					'info',
					sprintf(
						/* translators: %s: collaborator display name */
						__( '%s has joined the post.' ),
						collaborator.collaboratorInfo.name
					),
					{
						id: `${ NOTIFICATION_TYPE.COLLAB_USER_ENTERED }-${ collaborator.collaboratorInfo.id }`,
						type: 'snackbar',
						isDismissible: false,
					}
				);
			},
			[ createNotice ]
		)
	);

	useOnCollaboratorLeave(
		effectivePostId,
		effectivePostType,
		useCallback(
			( collaborator: PostEditorAwarenessState ) => {
				void createNotice(
					'info',
					sprintf(
						/* translators: %s: collaborator display name */
						__( '%s has left the post.' ),
						collaborator.collaboratorInfo.name
					),
					{
						id: `${ NOTIFICATION_TYPE.COLLAB_USER_EXITED }-${ collaborator.collaboratorInfo.id }`,
						type: 'snackbar',
						isDismissible: false,
					}
				);
			},
			[ createNotice ]
		)
	);

	useOnPostSave(
		effectivePostId,
		effectivePostType,
		useCallback(
			(
				saveEvent: PostSaveEvent,
				saver: PostEditorAwarenessState,
				prevEvent: PostSaveEvent | null
			) => {
				if ( ! postStatus ) {
					return;
				}

				// Prefer the remote status from Y.Doc (accurate at save time)
				// over the local Redux value, which may not have synced yet.
				const effectiveStatus =
					saveEvent.postStatus ?? postStatus ?? 'draft';

				// Use the previous save event's status when available for
				// accurate first-publish detection across rapid saves.
				const prevStatus = prevEvent?.postStatus ?? postStatus;
				const isFirstPublish =
					! (
						prevStatus && PUBLISHED_STATUSES.includes( prevStatus )
					) && PUBLISHED_STATUSES.includes( effectiveStatus );

				const message = getPostUpdatedMessage(
					saver.collaboratorInfo.name,
					effectiveStatus,
					isFirstPublish
				);

				void createNotice( 'info', message, {
					id: `${ NOTIFICATION_TYPE.COLLAB_POST_UPDATED }-${ saver.collaboratorInfo.id }`,
					type: 'snackbar',
					isDismissible: false,
				} );
			},
			[ createNotice, postStatus ]
		)
	);
}
