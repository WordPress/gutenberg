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
	const {
		postStatus,
		isCollaborationEnabled,
		showJoinNotifications,
		showLeaveNotifications,
		showPostSaveNotifications,
	} = useSelect( ( select ) => {
		const {
			getCurrentPostAttribute,
			isCollaborationEnabledForCurrentPost,
		} = unlock( select( editorStore ) );
		// Notification preferences default to enabled when unset.
		const getNotificationPreference = ( name: string ) =>
			select( preferencesStore ).get( 'core', name ) ?? true;
		return {
			postStatus: getCurrentPostAttribute( 'status' ) as
				| string
				| undefined,
			isCollaborationEnabled: isCollaborationEnabledForCurrentPost(),
			showJoinNotifications: getNotificationPreference(
				'showCollaborationJoinNotifications'
			),
			showLeaveNotifications: getNotificationPreference(
				'showCollaborationLeaveNotifications'
			),
			showPostSaveNotifications: getNotificationPreference(
				'showCollaborationPostSaveNotifications'
			),
		};
	}, [] );

	const { createNotice } = useDispatch( noticesStore );

	// Pass null when collaboration is disabled or a notification type is
	// turned off to prevent the hooks from subscribing to awareness state.
	const shouldShowJoinNotifications =
		isCollaborationEnabled && showJoinNotifications;
	const shouldShowLeaveNotifications =
		isCollaborationEnabled && showLeaveNotifications;
	const shouldShowPostSaveNotifications =
		isCollaborationEnabled && showPostSaveNotifications;
	// A disabled notification type passes null, which unsubscribes its hook;
	// callback guards handle any events already queued before then.
	const effectiveTarget = (
		shouldShow: boolean
	): [ number | null, string | null ] =>
		shouldShow ? [ postId, postType ] : [ null, null ];
	const [ joinPostId, joinPostType ] = effectiveTarget(
		shouldShowJoinNotifications
	);
	const [ leavePostId, leavePostType ] = effectiveTarget(
		shouldShowLeaveNotifications
	);
	const [ postSavePostId, postSavePostType ] = effectiveTarget(
		shouldShowPostSaveNotifications
	);

	useOnCollaboratorJoin(
		joinPostId,
		joinPostType,
		useCallback(
			(
				collaborator: PostEditorAwarenessState,
				me?: PostEditorAwarenessState
			) => {
				if ( ! shouldShowJoinNotifications ) {
					return;
				}

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
			[ createNotice, shouldShowJoinNotifications ]
		)
	);

	useOnCollaboratorLeave(
		leavePostId,
		leavePostType,
		useCallback(
			( collaborator: PostEditorAwarenessState ) => {
				if ( ! shouldShowLeaveNotifications ) {
					return;
				}

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
			[ createNotice, shouldShowLeaveNotifications ]
		)
	);

	useOnPostSave(
		postSavePostId,
		postSavePostType,
		useCallback(
			(
				saveEvent: PostSaveEvent,
				saver: PostEditorAwarenessState,
				prevEvent: PostSaveEvent | null
			) => {
				if ( ! shouldShowPostSaveNotifications || ! postStatus ) {
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
			[ createNotice, postStatus, shouldShowPostSaveNotifications ]
		)
	);
}
